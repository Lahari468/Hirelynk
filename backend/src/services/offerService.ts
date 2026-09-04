import { Prisma, OfferStatus } from "@prisma/client";
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import { createNotification } from "./notificationService.js";
import type {
  CreateOfferRequest,
  UpdateOfferRequest,
  OfferListQuery,
} from "../validators/offerValidator.js";

const toDecimal = (value: string | number): Prisma.Decimal =>
  new Prisma.Decimal(String(value));

interface OfferResponse {
  id: string;
  applicationId: string;
  createdBy: string;
  salary: string | null;
  startDate: Date | null;
  expiryDate: Date | null;
  notes: string | null;
  status: OfferStatus;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedOffers {
  items: OfferResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create an offer (recruiter only)
 */
export const createOffer = async (
  recruiterId: string,
  data: CreateOfferRequest
): Promise<OfferResponse> => {
  // Verify the application exists and get related data
  const application = await prisma.application.findUnique({
    where: { id: data.applicationId },
    include: {
      job: {
        select: {
          recruiterId: true,
          title: true,
        },
      },
      candidate: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  // Verify recruiter owns the job
  if (!application.job || application.job.recruiterId !== recruiterId) {
    throw new AuthorizationError(
      "You do not have permission to create an offer for this application"
    );
  }

  // Check if an offer already exists for this application
  const existingOffer = await prisma.offer.findUnique({
    where: { applicationId: data.applicationId },
  });

  if (existingOffer) {
    throw new ConflictError("An offer already exists for this application");
  }

  // Convert salary to Decimal if provided
  let salaryDecimal: Prisma.Decimal | null = null;
  if (data.salary) {
    salaryDecimal = toDecimal(data.salary);
  }

  // Create the offer
  const offer = await prisma.offer.create({
    data: {
      applicationId: data.applicationId,
      createdBy: recruiterId,
      salary: salaryDecimal,
      startDate: data.startDate ? new Date(data.startDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      notes: data.notes || null,
      status: "PENDING",
    },
  });

  // Create notification for candidate
  if (application.candidate.user) {
    await createNotification(
      application.candidate.user.id,
      "OFFER_RECEIVED",
      "New Job Offer",
      `You have received a new job offer for the ${application.job.title} position.`
    );
  }

  // Update application status to OFFER
  await prisma.application.update({
    where: { id: data.applicationId },
    data: { status: "OFFER" },
  });

  return {
    ...offer,
    salary: offer.salary ? offer.salary.toString() : null,
  } as OfferResponse;
};

/**
 * Get recruiter's offers
 */
export const getRecruiterOffers = async (
  recruiterId: string,
  query: OfferListQuery
): Promise<PaginatedOffers> => {
  const skip = (query.page - 1) * query.limit;

  const where: Record<string, unknown> = {
    createdBy: recruiterId,
  };

  if (query.status) {
    where.status = query.status;
  }

  const orderBy =
    query.sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    items: offers.map((offer) => ({
      ...offer,
      salary: offer.salary ? offer.salary.toString() : null,
    })) as OfferResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get candidate's offers
 */
export const getCandidateOffers = async (
  userId: string,
  query: OfferListQuery
): Promise<PaginatedOffers> => {
  // Get the candidate profile
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const skip = (query.page - 1) * query.limit;

  const where: Record<string, unknown> = {
    application: {
      candidateId: candidateProfile.id,
    },
  };

  if (query.status) {
    where.status = query.status;
  }

  const orderBy =
    query.sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    items: offers.map((offer) => ({
      ...offer,
      salary: offer.salary ? offer.salary.toString() : null,
    })) as OfferResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get single offer with authorization check
 */
export const getOffer = async (
  offerId: string,
  userId: string,
  userRole: string
): Promise<OfferResponse> => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      application: {
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!offer) {
    throw new NotFoundError("Offer not found");
  }

  // Check ownership
  if (userRole === "RECRUITER") {
    // Recruiter can only see offers they created
    if (offer.createdBy !== userId) {
      throw new AuthorizationError(
        "You do not have permission to view this offer"
      );
    }
  } else if (userRole === "CANDIDATE") {
    // Candidate can only see their own offers
    if (offer.application.candidate.user.id !== userId) {
      throw new AuthorizationError(
        "You do not have permission to view this offer"
      );
    }
  }

  return {
    ...offer,
    salary: offer.salary ? offer.salary.toString() : null,
  } as OfferResponse;
};

/**
 * Update offer (recruiter only)
 */
export const updateOffer = async (
  offerId: string,
  recruiterId: string,
  data: UpdateOfferRequest
): Promise<OfferResponse> => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw new NotFoundError("Offer not found");
  }

  // Only recruiter who created it can update
  if (offer.createdBy !== recruiterId) {
    throw new AuthorizationError(
      "You do not have permission to update this offer"
    );
  }

  // Can't update accepted or rejected offers
  if (offer.status === "ACCEPTED" || offer.status === "REJECTED") {
    throw new ConflictError(
      `Cannot update an offer that has been ${offer.status.toLowerCase()}`
    );
  }

  // Convert salary to Decimal if provided
  let updateData: Record<string, unknown> = {};
  if (data.salary) {
    updateData.salary = toDecimal(data.salary);
  }
  if (data.startDate) {
    updateData.startDate = new Date(data.startDate);
  }
  if (data.expiryDate) {
    updateData.expiryDate = new Date(data.expiryDate);
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes || null;
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: updateData,
  });

  return {
    ...updated,
    salary: updated.salary ? updated.salary.toString() : null,
  } as OfferResponse;
};

/**
 * Accept offer (candidate only)
 */
export const acceptOffer = async (
  offerId: string,
  userId: string
): Promise<OfferResponse> => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      application: {
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!offer) {
    throw new NotFoundError("Offer not found");
  }

  // Verify it belongs to the candidate
  if (offer.application.candidate.user.id !== userId) {
    throw new AuthorizationError(
      "You do not have permission to accept this offer"
    );
  }

  // Can't accept rejected or withdrawn offers
  if (offer.status === "REJECTED") {
    throw new ConflictError("Cannot accept a rejected offer");
  }

  if (offer.status === "WITHDRAWN") {
    throw new ConflictError("Cannot accept a withdrawn offer");
  }

  if (offer.status === "EXPIRED") {
    throw new ConflictError("Cannot accept an expired offer");
  }

  if (offer.status === "ACCEPTED") {
    throw new ConflictError("This offer has already been accepted");
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  // Update application status to HIRED
  await prisma.application.update({
    where: { id: offer.applicationId },
    data: { status: "HIRED" },
  });

  // Notify recruiter
  await createNotification(
    offer.createdBy,
    "OFFER_ACCEPTED",
    "Offer Accepted",
    `Your job offer has been accepted by the candidate.`
  );

  return {
    ...updated,
    salary: updated.salary ? updated.salary.toString() : null,
  } as OfferResponse;
};

/**
 * Reject offer (candidate only)
 */
export const rejectOffer = async (
  offerId: string,
  userId: string
): Promise<OfferResponse> => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      application: {
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!offer) {
    throw new NotFoundError("Offer not found");
  }

  // Verify it belongs to the candidate
  if (offer.application.candidate.user.id !== userId) {
    throw new AuthorizationError(
      "You do not have permission to reject this offer"
    );
  }

  // Can't reject accepted or withdrawn offers
  if (offer.status === "ACCEPTED") {
    throw new ConflictError("Cannot reject an accepted offer");
  }

  if (offer.status === "WITHDRAWN") {
    throw new ConflictError("Cannot reject a withdrawn offer");
  }

  if (offer.status === "REJECTED") {
    throw new ConflictError("This offer has already been rejected");
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
    },
  });

  // Update application status to REJECTED
  await prisma.application.update({
    where: { id: offer.applicationId },
    data: { status: "REJECTED" },
  });

  // Notify recruiter
  await createNotification(
    offer.createdBy,
    "OFFER_REJECTED",
    "Offer Rejected",
    `Your job offer has been rejected by the candidate.`
  );

  return {
    ...updated,
    salary: updated.salary ? updated.salary.toString() : null,
  } as OfferResponse;
};

/**
 * Withdraw offer (recruiter only)
 */
export const withdrawOffer = async (
  offerId: string,
  recruiterId: string
): Promise<OfferResponse> => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      application: {
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!offer) {
    throw new NotFoundError("Offer not found");
  }

  // Only recruiter who created it can withdraw
  if (offer.createdBy !== recruiterId) {
    throw new AuthorizationError(
      "You do not have permission to withdraw this offer"
    );
  }

  // Can't withdraw accepted or rejected offers
  if (offer.status === "ACCEPTED") {
    throw new ConflictError("Cannot withdraw an accepted offer");
  }

  if (offer.status === "REJECTED") {
    throw new ConflictError("Cannot withdraw a rejected offer");
  }

  if (offer.status === "WITHDRAWN") {
    throw new ConflictError("This offer has already been withdrawn");
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: { status: "WITHDRAWN" },
  });

  // Notify candidate
  if (offer.application.candidate.user) {
    await createNotification(
      offer.application.candidate.user.id,
      "OFFER_WITHDRAWN",
      "Offer Withdrawn",
      `The job offer has been withdrawn.`
    );
  }

  return {
    ...updated,
    salary: updated.salary ? updated.salary.toString() : null,
  } as OfferResponse;
};