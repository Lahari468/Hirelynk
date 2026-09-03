import { InterviewStatus, InterviewType } from "@prisma/client";
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import { createNotification } from "./notificationService.js";
import type {
  CreateInterviewRequest,
  UpdateInterviewRequest,
  CompleteInterviewRequest,
  InterviewListQuery,
} from "../validators/interviewValidator.js";

interface InterviewResponse {
  id: string;
  applicationId: string;
  scheduledBy: string;
  interviewType: InterviewType;
  scheduledAt: Date;
  duration: number | null;
  meetingLink: string | null;
  status: InterviewStatus;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedInterviews {
  items: InterviewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create an interview (recruiter only)
 */
export const createInterview = async (
  recruiterId: string,
  data: CreateInterviewRequest
): Promise<InterviewResponse> => {
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
      "You do not have permission to schedule interviews for this application"
    );
  }

  // Verify scheduledAt is in the future
  const scheduledDate = new Date(data.scheduledAt);
  if (scheduledDate <= new Date()) {
    throw new ConflictError("Interview must be scheduled for a future date");
  }

  // Create the interview
  const interview = await prisma.interview.create({
    data: {
      applicationId: data.applicationId,
      scheduledBy: recruiterId,
      interviewType: data.interviewType,
      scheduledAt: scheduledDate,
      duration: data.duration || null,
      meetingLink: data.meetingLink || null,
      status: "SCHEDULED",
    },
  });

  // Create notification for candidate
  if (application.candidate.user) {
    await createNotification(
      application.candidate.user.id,
      "INTERVIEW_SCHEDULED",
      "Interview Scheduled",
      `You have an interview scheduled for ${scheduledDate.toLocaleString()} for the ${application.job.title} position.`
    );
  }

  return interview as InterviewResponse;
};

/**
 * Get recruiter's all interviews
 */
export const getRecruiterInterviews = async (
  recruiterId: string,
  query: InterviewListQuery
): Promise<PaginatedInterviews> => {
  const skip = (query.page - 1) * query.limit;

  const where: Record<string, unknown> = {
    scheduledBy: recruiterId,
  };

  if (query.status) {
    where.status = query.status;
  }

  const orderBy =
    query.sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.interview.count({ where }),
  ]);

  return {
    items: interviews as InterviewResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get candidate's interviews
 */
export const getCandidateInterviews = async (
  userId: string,
  query: InterviewListQuery
): Promise<PaginatedInterviews> => {
  // First get the candidate profile
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

  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.interview.count({ where }),
  ]);

  return {
    items: interviews as InterviewResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get single interview (with ownership check)
 */
export const getInterview = async (
  interviewId: string,
  userId: string,
  userRole: string
): Promise<InterviewResponse> => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
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
          job: {
            select: {
              recruiterId: true,
            },
          },
        },
      },
    },
  });

  if (!interview) {
    throw new NotFoundError("Interview not found");
  }

  // Check ownership
  if (userRole === "RECRUITER") {
    // Recruiter can only see interviews they scheduled
    if (interview.scheduledBy !== userId) {
      throw new AuthorizationError(
        "You do not have permission to view this interview"
      );
    }
  } else if (userRole === "CANDIDATE") {
    // Candidate can only see their own interviews
    if (interview.application.candidate.user.id !== userId) {
      throw new AuthorizationError(
        "You do not have permission to view this interview"
      );
    }
  }

  return interview as InterviewResponse;
};

/**
 * Update interview (recruiter only)
 */
export const updateInterview = async (
  interviewId: string,
  recruiterId: string,
  data: UpdateInterviewRequest
): Promise<InterviewResponse> => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) {
    throw new NotFoundError("Interview not found");
  }

  // Only recruiter who scheduled it can update
  if (interview.scheduledBy !== recruiterId) {
    throw new AuthorizationError(
      "You do not have permission to update this interview"
    );
  }

  // Can't update cancelled interviews
  if (interview.status === "CANCELLED") {
    throw new ConflictError("Cannot update a cancelled interview");
  }

  // If rescheduling, verify new date is in future
  if (data.scheduledAt) {
    const scheduledDate = new Date(data.scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new ConflictError("Interview must be scheduled for a future date");
    }
  }

  const updated = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      ...(data.interviewType && { interviewType: data.interviewType }),
      ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.meetingLink !== undefined && {
        meetingLink: data.meetingLink || null,
      }),
    },
  });

  return updated as InterviewResponse;
};

/**
 * Cancel interview
 */
export const cancelInterview = async (
  interviewId: string,
  recruiterId: string
): Promise<InterviewResponse> => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
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

  if (!interview) {
    throw new NotFoundError("Interview not found");
  }

  // Only recruiter who scheduled it can cancel
  if (interview.scheduledBy !== recruiterId) {
    throw new AuthorizationError(
      "You do not have permission to cancel this interview"
    );
  }

  // Can't cancel already completed interviews
  if (interview.status === "COMPLETED") {
    throw new ConflictError("Cannot cancel a completed interview");
  }

  const updated = await prisma.interview.update({
    where: { id: interviewId },
    data: { status: "CANCELLED" },
  });

  // Create notification for candidate
  if (interview.application.candidate.user) {
    await createNotification(
      interview.application.candidate.user.id,
      "INTERVIEW_CANCELLED",
      "Interview Cancelled",
      `Your interview scheduled for ${interview.scheduledAt.toLocaleString()} has been cancelled.`
    );
  }

  return updated as InterviewResponse;
};

/**
 * Complete interview with feedback
 */
export const completeInterview = async (
  interviewId: string,
  recruiterId: string,
  data: CompleteInterviewRequest
): Promise<InterviewResponse> => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
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

  if (!interview) {
    throw new NotFoundError("Interview not found");
  }

  // Only recruiter who scheduled it can complete
  if (interview.scheduledBy !== recruiterId) {
    throw new AuthorizationError(
      "You do not have permission to complete this interview"
    );
  }

  // Can't complete cancelled or already completed interviews
  if (interview.status === "CANCELLED") {
    throw new ConflictError("Cannot complete a cancelled interview");
  }

  if (interview.status === "COMPLETED") {
    throw new ConflictError("This interview is already completed");
  }

  const updated = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      status: "COMPLETED",
      feedback: data.feedback,
    },
  });

  return updated as InterviewResponse;
};