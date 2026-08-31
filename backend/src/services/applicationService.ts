import { ApplicationStatus } from "@prisma/client";
import {
  NotFoundError,
  ConflictError,
} from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import type {
  CreateApplicationRequest,
  ApplicationStatusUpdateRequest,
  ApplicationListQuery,
} from "../validators/applicationValidator.js";

interface JobInfo {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  company: {
    id: string;
    name: string;
  };
}

interface ResumeInfo {
  id: string;
  fileName: string;
  fileUrl: string;
}

interface CandidateInfo {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  experienceYears: number | null;
  education: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
}

interface StatusHistoryItem {
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  comment: string | null;
  changedAt: Date;
}

interface ApplicationResponse {
  id: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  coverLetter: string | null;
  job?: JobInfo;
  resume?: ResumeInfo;
  statusHistory?: StatusHistoryItem[];
  candidate?: CandidateInfo;
}

/**
 * Valid status transitions
 */
const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ["SCREENING", "REJECTED"],
  SCREENING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};

/**
 * Create an application for a candidate
 */
export const createApplication = async (
  userId: string,
  data: CreateApplicationRequest
): Promise<ApplicationResponse> => {
  // Get candidate profile
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  // Get job
  const job = await prisma.job.findUnique({
    where: { id: data.jobId },
    include: { company: { select: { id: true, name: true } } },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "OPEN") {
    throw new ConflictError("Can only apply to open jobs");
  }

  // Get resume and verify it belongs to candidate
  const resume = await prisma.resume.findUnique({
    where: { id: data.resumeId },
  });

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  if (resume.candidateId !== candidateProfile.id) {
    throw new NotFoundError("Resume not found");
  }

  // Check for duplicate application
  const existingApplication = await prisma.application.findUnique({
    where: {
      candidateId_jobId: {
        candidateId: candidateProfile.id,
        jobId: data.jobId,
      },
    },
  });

  if (existingApplication) {
    throw new ConflictError("You have already applied to this job");
  }

  // Create application and status history in transaction
  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        candidateId: candidateProfile.id,
        jobId: data.jobId,
        resumeId: data.resumeId,
        coverLetter: data.coverLetter,
        status: "APPLIED" as ApplicationStatus,
      },
      include: {
        job: {
          include: { company: { select: { id: true, name: true } } },
        },
        resume: {
          select: { id: true, fileName: true, fileUrl: true },
        },
      },
    });

    // Create initial status history
    await tx.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        oldStatus: null,
        newStatus: "APPLIED" as ApplicationStatus,
        changedBy: userId,
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: "APPLICATION_CREATED",
        entityType: "Application",
        entityId: application.id,
        metadata: {
          candidateId: candidateProfile.id,
          jobId: data.jobId,
        },
      },
    });

    return application;
  });

  return {
    id: result.id,
    status: result.status,
    appliedAt: result.appliedAt,
    updatedAt: result.updatedAt,
    coverLetter: result.coverLetter,
    job: mapJobInfo(result.job),
    resume: mapResumeInfo(result.resume),
  };
};

/**
 * Get candidate's applications
 */
export const getCandidateApplications = async (
  userId: string,
  query: ApplicationListQuery
): Promise<{
  items: ApplicationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const skip = (query.page - 1) * query.limit;

  // Verify candidate profile
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const where: Record<string, unknown> = { candidateId: candidateProfile.id };
  if (query.status) {
    where.status = query.status;
  }

  const orderBy =
    query.sort === "oldest"
      ? { appliedAt: "asc" as const }
      : { appliedAt: "desc" as const };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        job: {
          include: { company: { select: { id: true, name: true } } },
        },
        resume: {
          select: { id: true, fileName: true, fileUrl: true },
        },
      },
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.application.count({ where }),
  ]);

  const items = applications.map((app) => ({
    id: app.id,
    status: app.status,
    appliedAt: app.appliedAt,
    updatedAt: app.updatedAt,
    coverLetter: app.coverLetter,
    job: mapJobInfo(app.job),
    resume: mapResumeInfo(app.resume),
  }));

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get single candidate application
 */
export const getCandidateApplication = async (
  applicationId: string,
  userId: string
): Promise<ApplicationResponse> => {
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: { company: { select: { id: true, name: true } } },
      },
      resume: {
        select: { id: true, fileName: true, fileUrl: true },
      },
      statusHistory: {
        select: {
          oldStatus: true,
          newStatus: true,
          comment: true,
          changedAt: true,
        },
        orderBy: { changedAt: "asc" as const },
      },
    },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (application.candidateId !== candidateProfile.id) {
    throw new NotFoundError("Application not found");
  }

  return {
    id: application.id,
    status: application.status,
    appliedAt: application.appliedAt,
    updatedAt: application.updatedAt,
    coverLetter: application.coverLetter,
    job: mapJobInfo(application.job),
    resume: mapResumeInfo(application.resume),
    statusHistory: application.statusHistory,
  };
};

/**
 * Get recruiter's job applications
 */
export const getJobApplications = async (
  jobId: string,
  recruiterId: string,
  query: ApplicationListQuery
): Promise<{
  items: ApplicationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const skip = (query.page - 1) * query.limit;

  // Verify job belongs to recruiter
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== recruiterId) {
    throw new NotFoundError("Job not found");
  }

  const where: Record<string, unknown> = { jobId };
  if (query.status) {
    where.status = query.status;
  }

  const orderBy =
    query.sort === "oldest"
      ? { appliedAt: "asc" as const }
      : { appliedAt: "desc" as const };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        resume: {
          select: { id: true, fileName: true, fileUrl: true },
        },
      },
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.application.count({ where }),
  ]);

  const items = applications.map((app) => ({
    id: app.id,
    status: app.status,
    appliedAt: app.appliedAt,
    updatedAt: app.updatedAt,
    coverLetter: app.coverLetter,
    resume: mapResumeInfo(app.resume),
  }));

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get recruiter's view of single application
 */
export const getRecruiterApplication = async (
  applicationId: string,
  recruiterId: string
): Promise<ApplicationResponse & { candidate: CandidateInfo }> => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: { recruiterId: true },
      },
      candidate: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      resume: {
        select: { id: true, fileName: true, fileUrl: true },
      },
      statusHistory: {
        select: {
          oldStatus: true,
          newStatus: true,
          comment: true,
          changedAt: true,
        },
        orderBy: { changedAt: "asc" as const },
      },
    },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (!application.job || application.job.recruiterId !== recruiterId) {
    throw new NotFoundError("Application not found");
  }

  return {
    id: application.id,
    status: application.status,
    appliedAt: application.appliedAt,
    updatedAt: application.updatedAt,
    coverLetter: application.coverLetter,
    resume: mapResumeInfo(application.resume),
    statusHistory: application.statusHistory,
    candidate: {
      id: application.candidate.id,
      name: application.candidate.user.name,
      email: application.candidate.user.email,
      headline: application.candidate.headline,
      bio: application.candidate.bio,
      phone: application.candidate.phone,
      location: application.candidate.location,
      experienceYears: application.candidate.experienceYears,
      education: application.candidate.education,
      linkedinUrl: application.candidate.linkedinUrl,
      githubUrl: application.candidate.githubUrl,
    },
  };
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  applicationId: string,
  recruiterId: string,
  data: ApplicationStatusUpdateRequest
): Promise<ApplicationResponse> => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: { recruiterId: true },
      },
    },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (!application.job || application.job.recruiterId !== recruiterId) {
    throw new NotFoundError("Application not found");
  }

  // Validate status transition
  const allowedTransitions = validTransitions[application.status];
  if (!allowedTransitions.includes(data.status)) {
    throw new ConflictError(
      `Cannot transition from ${application.status} to ${data.status}`
    );
  }

  // Update status and create history in transaction
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: { status: data.status },
    });

    // Create status history
    await tx.applicationStatusHistory.create({
      data: {
        applicationId: updated.id,
        oldStatus: application.status,
        newStatus: data.status,
        changedBy: recruiterId,
        comment: data.comment,
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId: recruiterId,
        action: "APPLICATION_STATUS_CHANGED",
        entityType: "Application",
        entityId: updated.id,
        metadata: {
          oldStatus: application.status,
          newStatus: data.status,
        },
      },
    });

    return updated;
  });

  // Fetch full updated application with history
  const fullApplication = await prisma.application.findUnique({
    where: { id: result.id },
    include: {
      statusHistory: {
        select: {
          oldStatus: true,
          newStatus: true,
          comment: true,
          changedAt: true,
        },
        orderBy: { changedAt: "asc" as const },
      },
    },
  });

  return {
    id: result.id,
    status: result.status,
    appliedAt: result.appliedAt,
    updatedAt: result.updatedAt,
    coverLetter: result.coverLetter,
    statusHistory: fullApplication?.statusHistory || [],
  };
};

const mapJobInfo = (
  job: {
    id: string;
    title: string;
    location: string;
    employmentType: string;
    company: { id: string; name: string };
  } | null
): JobInfo | undefined => {
  if (!job) return undefined;

  return {
    id: job.id,
    title: job.title,
    location: job.location,
    employmentType: job.employmentType,
    company: job.company,
  };
};

const mapResumeInfo = (
  resume: { id: string; fileName: string; fileUrl: string } | null
): ResumeInfo | undefined => {
  if (!resume) return undefined;

  return {
    id: resume.id,
    fileName: resume.fileName,
    fileUrl: resume.fileUrl,
  };
};