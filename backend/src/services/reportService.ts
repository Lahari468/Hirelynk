import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import { createNotification } from "./notificationService.js";
import type {
  CreateReportRequest,
  ReportListQuery,
  AdminReportListQuery,
  AdminUpdateReportRequest,
} from "../validators/reportValidator.js";

interface ReportResponse {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: string;
  resolvedBy: string | null;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedReports {
  items: ReportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Shared include/check used to authorize a report target against the
// requesting user's recruitment relationship (same pattern already used
// by messageService and feedbackService).
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
  job: { recruiterId: string } | null;
  candidate: { user: { id: string } };
};

const isApplicationParticipant = (
  application: ApplicationForAuth,
  userId: string,
  userRole: string
): boolean => {
  if (userRole === "CANDIDATE") {
    return application.candidate.user.id === userId;
  }
  if (userRole === "RECRUITER") {
    return !!application.job && application.job.recruiterId === userId;
  }
  return false;
};

/**
 * Verify that the report target exists and that the reporter is
 * legitimately allowed to report it. Never trusts client-provided
 * ownership - every check re-derives the relationship from the database.
 */
const verifyReportTarget = async (
  targetType: CreateReportRequest["targetType"],
  targetId: string,
  reporterId: string,
  reporterRole: string
): Promise<void> => {
  switch (targetType) {
    case "JOB": {
      const job = await prisma.job.findUnique({ where: { id: targetId } });
      if (!job) {
        throw new NotFoundError("Report target not found");
      }
      // Any authenticated participant may report a job listing - no
      // additional ownership relationship is required.
      return;
    }

    case "USER": {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetId },
      });
      if (!targetUser) {
        throw new NotFoundError("Report target not found");
      }
      if (targetId === reporterId) {
        throw new ValidationError("You cannot report yourself");
      }
      return;
    }

    case "APPLICATION": {
      const application = await prisma.application.findUnique({
        where: { id: targetId },
        include: applicationAuthInclude,
      });
      if (!application) {
        throw new NotFoundError("Report target not found");
      }
      if (!isApplicationParticipant(application, reporterId, reporterRole)) {
        throw new AuthorizationError(
          "You do not have permission to report this application"
        );
      }
      return;
    }

    case "MESSAGE": {
      const message = await prisma.message.findUnique({
        where: { id: targetId },
        include: {
          conversation: {
            include: {
              application: { include: applicationAuthInclude },
            },
          },
        },
      });
      if (!message) {
        throw new NotFoundError("Report target not found");
      }
      if (
        !isApplicationParticipant(
          message.conversation.application,
          reporterId,
          reporterRole
        )
      ) {
        throw new AuthorizationError(
          "You do not have permission to report this message"
        );
      }
      return;
    }

    case "FEEDBACK": {
      const feedback = await prisma.feedback.findUnique({
        where: { id: targetId },
        include: {
          application: { include: applicationAuthInclude },
        },
      });
      if (!feedback) {
        throw new NotFoundError("Report target not found");
      }
      if (
        !isApplicationParticipant(feedback.application, reporterId, reporterRole)
      ) {
        throw new AuthorizationError(
          "You do not have permission to report this feedback"
        );
      }
      return;
    }
  }
};

/**
 * Create a report against a legitimate HireLynk entity. At most one
 * active (PENDING/REVIEWING) report per reporter per target is allowed;
 * a new report may be filed again once a prior one has been resolved or
 * dismissed.
 */
export const createReport = async (
  reporterId: string,
  reporterRole: string,
  data: CreateReportRequest
): Promise<ReportResponse> => {
  await verifyReportTarget(
    data.targetType,
    data.targetId,
    reporterId,
    reporterRole
  );

  const existingActive = await prisma.report.findFirst({
    where: {
      reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      status: { in: ["PENDING", "REVIEWING"] },
    },
  });

  if (existingActive) {
    throw new ConflictError(
      "You already have an active report for this target"
    );
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      description: data.description || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: reporterId,
      action: "REPORT_CREATED",
      entityType: "Report",
      entityId: report.id,
      metadata: {
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
      },
    },
  });

  return report as ReportResponse;
};

/**
 * List the authenticated user's own reports.
 */
export const listMyReports = async (
  userId: string,
  query: ReportListQuery
): Promise<PaginatedReports> => {
  const skip = (query.page - 1) * query.limit;

  const where: Record<string, unknown> = { reporterId: userId };
  if (query.status) {
    where.status = query.status;
  }

  const orderBy =
    query.sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    items: items as ReportResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get a single report the user submitted. Returns NotFoundError (rather
 * than AuthorizationError) when the report belongs to someone else, to
 * avoid confirming that a given report ID exists.
 */
export const getMyReport = async (
  reportId: string,
  userId: string
): Promise<ReportResponse> => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report || report.reporterId !== userId) {
    throw new NotFoundError("Report not found");
  }

  return report as ReportResponse;
};

/**
 * Admin: list all reports, optionally filtered by status/targetType.
 */
export const adminListReports = async (
  query: AdminReportListQuery
): Promise<PaginatedReports> => {
  const skip = (query.page - 1) * query.limit;

  const where: Record<string, unknown> = {};
  if (query.status) {
    where.status = query.status;
  }
  if (query.targetType) {
    where.targetType = query.targetType;
  }

  const orderBy =
    query.sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    items: items as ReportResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Admin: get a single report by ID.
 */
export const adminGetReport = async (
  reportId: string
): Promise<ReportResponse> => {
  const report = await prisma.report.findUnique({ where: { id: reportId } });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  return report as ReportResponse;
};

// Valid forward-only status transitions. Reopening a resolved/dismissed
// report is not a supported business rule for Phase 19.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["REVIEWING", "RESOLVED", "DISMISSED"],
  REVIEWING: ["RESOLVED", "DISMISSED"],
  RESOLVED: [],
  DISMISSED: [],
};

const auditActionForStatus = (
  status: "REVIEWING" | "RESOLVED" | "DISMISSED"
): "REPORT_REVIEWED" | "REPORT_RESOLVED" | "REPORT_DISMISSED" => {
  if (status === "REVIEWING") return "REPORT_REVIEWED";
  if (status === "RESOLVED") return "REPORT_RESOLVED";
  return "REPORT_DISMISSED";
};

/**
 * Admin: transition a report's status (review / resolve / dismiss).
 */
export const adminUpdateReport = async (
  reportId: string,
  adminUserId: string,
  data: AdminUpdateReportRequest
): Promise<ReportResponse> => {
  const report = await prisma.report.findUnique({ where: { id: reportId } });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  const allowedNext = ALLOWED_TRANSITIONS[report.status] || [];
  if (!allowedNext.includes(data.status)) {
    throw new ConflictError(
      `Cannot transition a report from ${report.status} to ${data.status}`
    );
  }

  const isFinal = data.status === "RESOLVED" || data.status === "DISMISSED";

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: data.status,
      ...(data.resolutionNote !== undefined && {
        resolutionNote: data.resolutionNote,
      }),
      ...(isFinal && {
        resolvedBy: adminUserId,
        resolvedAt: new Date(),
      }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: auditActionForStatus(data.status),
      entityType: "Report",
      entityId: report.id,
      metadata: {
        previousStatus: report.status,
        newStatus: data.status,
      },
    },
  });

  if (isFinal) {
    const title =
      data.status === "RESOLVED" ? "Report Resolved" : "Report Dismissed";
    const message =
      data.status === "RESOLVED"
        ? "Your report has been reviewed and resolved."
        : "Your report has been reviewed and dismissed.";
    await createNotification(
      report.reporterId,
      "REPORT_STATUS_UPDATED",
      title,
      message
    );
  }

  return updated as ReportResponse;
};