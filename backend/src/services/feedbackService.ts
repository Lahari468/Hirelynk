import { NotFoundError, AuthorizationError, ConflictError } from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import { createNotification } from "./notificationService.js";
import type {
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackListQuery,
} from "../validators/feedbackValidator.js";

interface FeedbackResponse {
  id: string;
  applicationId: string;
  authorId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedFeedback {
  items: FeedbackResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Shared include used to authorize a feedback entry against the requesting
// user's recruitment relationship (same pattern as messageService).
const applicationAuthInclude = {
  job: {
    select: {
      recruiterId: true,
    },
  },
  candidate: {
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  },
} as const;

type ApplicationForAuth = {
  id: string;
  job: { recruiterId: string } | null;
  candidate: { user: { id: string } };
};

/**
 * Verify that the given user is a legitimate participant (candidate or
 * recruiter) of the recruitment relationship behind an application, and
 * return the other party's identity for notification purposes.
 */
const assertParticipant = (
  application: ApplicationForAuth,
  userId: string,
  userRole: string
): { recruiterId: string | null; candidateUserId: string } => {
  const candidateUserId = application.candidate.user.id;
  const recruiterId = application.job ? application.job.recruiterId : null;

  if (userRole === "CANDIDATE") {
    if (candidateUserId !== userId) {
      throw new AuthorizationError(
        "You do not have permission to access feedback for this application"
      );
    }
  } else if (userRole === "RECRUITER") {
    if (!recruiterId || recruiterId !== userId) {
      throw new AuthorizationError(
        "You do not have permission to access feedback for this application"
      );
    }
  } else {
    throw new AuthorizationError(
      "Only candidates and recruiters can use recruitment feedback"
    );
  }

  return { recruiterId, candidateUserId };
};

/**
 * Create feedback tied to a legitimate recruitment relationship
 * (an application the requesting user is a genuine participant of).
 * At most one feedback entry per author per application is allowed.
 */
export const createFeedback = async (
  userId: string,
  userRole: string,
  data: CreateFeedbackRequest
): Promise<FeedbackResponse> => {
  const application = await prisma.application.findUnique({
    where: { id: data.applicationId },
    include: applicationAuthInclude,
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  const { recruiterId, candidateUserId } = assertParticipant(
    application,
    userId,
    userRole
  );

  const existing = await prisma.feedback.findUnique({
    where: {
      applicationId_authorId: {
        applicationId: application.id,
        authorId: userId,
      },
    },
  });

  if (existing) {
    throw new ConflictError(
      "You have already submitted feedback for this application"
    );
  }

  let feedback;
  try {
    feedback = await prisma.feedback.create({
      data: {
        applicationId: application.id,
        authorId: userId,
        rating: data.rating,
        comment: data.comment,
      },
    });
  } catch {
    // Backstop against a race condition on the unique constraint.
    throw new ConflictError(
      "You have already submitted feedback for this application"
    );
  }

  // Notify the other participant.
  const recipientId = userRole === "CANDIDATE" ? recruiterId : candidateUserId;
  if (recipientId) {
    await createNotification(
      recipientId,
      "FEEDBACK_RECEIVED",
      "New Feedback",
      "You have received new recruitment feedback."
    );
  }

  return feedback as FeedbackResponse;
};

/**
 * List feedback the authenticated user is entitled to see: feedback
 * (from either participant) tied to applications they are legitimately
 * part of. Optionally scoped to a single application.
 */
export const listFeedback = async (
  userId: string,
  userRole: string,
  query: FeedbackListQuery
): Promise<PaginatedFeedback> => {
  const skip = (query.page - 1) * query.limit;

  let where: Record<string, unknown>;

  if (userRole === "CANDIDATE") {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!candidateProfile) {
      throw new NotFoundError("Candidate profile not found");
    }

    where = { application: { candidateId: candidateProfile.id } };
  } else if (userRole === "RECRUITER") {
    where = { application: { job: { recruiterId: userId } } };
  } else {
    throw new AuthorizationError(
      "Only candidates and recruiters can use recruitment feedback"
    );
  }

  if (query.applicationId) {
    where = { ...where, applicationId: query.applicationId };
  }

  const orderBy =
    query.sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.feedback.count({ where }),
  ]);

  return {
    items: items as FeedbackResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get a single feedback entry (with participant authorization check).
 */
export const getFeedback = async (
  feedbackId: string,
  userId: string,
  userRole: string
): Promise<FeedbackResponse> => {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      application: {
        include: applicationAuthInclude,
      },
    },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found");
  }

  assertParticipant(feedback.application, userId, userRole);

  return feedback as FeedbackResponse;
};

/**
 * Update feedback. Only the original author may update their own entry.
 */
export const updateFeedback = async (
  feedbackId: string,
  userId: string,
  userRole: string,
  data: UpdateFeedbackRequest
): Promise<FeedbackResponse> => {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      application: {
        include: applicationAuthInclude,
      },
    },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found");
  }

  // Confirms the recruitment relationship is still legitimate before
  // allowing an edit.
  assertParticipant(feedback.application, userId, userRole);

  if (feedback.authorId !== userId) {
    throw new AuthorizationError(
      "You do not have permission to update this feedback"
    );
  }

  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.comment !== undefined && { comment: data.comment }),
    },
  });

  return updated as FeedbackResponse;
};