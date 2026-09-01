import { prisma } from "../utils/prismaClient.js";
import { NotFoundError } from "../types/index.js";
import type {
  RecruiterDashboardQuery,
  ApplicationListQuery,
} from "../validators/recruiterDashboardValidator.js";

interface JobStats {
  total: number;
  draft: number;
  open: number;
  closed: number;
}

interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
}

interface RecentApplication {
  id: string;
  status: string;
  appliedAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
  } | null;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
}

interface DashboardStats {
  jobs: JobStats;
  applications: ApplicationStats;
  recentApplications: RecentApplication[];
}

/**
 * Get recruiter dashboard statistics
 */
export const getRecruiterDashboard = async (
  userId: string,
  query: RecruiterDashboardQuery
): Promise<DashboardStats> => {
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId },
  });

  if (!recruiterProfile) {
    throw new NotFoundError("Recruiter profile not found");
  }

  const [jobStats, appStats, recentApps] = await Promise.all([
    getJobStats(userId),
    getApplicationStats(userId),
    getRecentApplications(userId, query.recentLimit),
  ]);

  return {
    jobs: jobStats,
    applications: appStats,
    recentApplications: recentApps,
  };
};

/**
 * Get recruiter's job statistics
 */
async function getJobStats(userId: string): Promise<JobStats> {
  const [total, draft, open, closed] = await Promise.all([
    prisma.job.count({
      where: { recruiterId: userId },
    }),
    prisma.job.count({
      where: { recruiterId: userId, status: "DRAFT" },
    }),
    prisma.job.count({
      where: { recruiterId: userId, status: "OPEN" },
    }),
    prisma.job.count({
      where: { recruiterId: userId, status: "CLOSED" },
    }),
  ]);

  return { total, draft, open, closed };
}

/**
 * Get recruiter's application statistics
 */
async function getApplicationStats(userId: string): Promise<ApplicationStats> {
  const [total, statusGroups] = await Promise.all([
    prisma.application.count({
      where: {
        job: {
          recruiterId: userId,
        },
      },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: {
        job: {
          recruiterId: userId,
        },
      },
      _count: true,
    }),
  ]);

  const byStatus: Record<string, number> = {
    APPLIED: 0,
    SCREENING: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0,
  };

  statusGroups.forEach((group) => {
    byStatus[group.status] = group._count;
  });

  return { total, byStatus };
}

/**
 * Get recent applications for recruiter's jobs
 */
async function getRecentApplications(
  userId: string,
  limit: number
): Promise<RecentApplication[]> {
  const applications = await prisma.application.findMany({
    where: {
      job: {
        recruiterId: userId,
      },
    },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      updatedAt: true,
      job: {
        select: {
          id: true,
          title: true,
        },
      },
      candidate: {
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" as const },
    take: limit,
  });

  return applications.map((app) => ({
    id: app.id,
    status: app.status,
    appliedAt: app.appliedAt,
    updatedAt: app.updatedAt,
    job: app.job
      ? {
          id: app.job.id,
          title: app.job.title,
        }
      : null,
    candidate: {
      id: app.candidate.id,
      name: app.candidate.user.name,
      email: app.candidate.user.email,
    },
  }));
}

/**
 * List applications for a specific job (with enhanced filtering)
 */
export const listJobApplications = async (
  jobId: string,
  userId: string,
  query: ApplicationListQuery
): Promise<{
  items: Array<{
    id: string;
    status: string;
    appliedAt: Date;
    updatedAt: Date;
    candidate: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  // Verify job belongs to recruiter
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { recruiterId: true },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== userId) {
    throw new NotFoundError("Job not found");
  }

  const skip = (query.page - 1) * query.limit;

  const where: Record<string, unknown> = { jobId };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      {
        candidate: {
          user: {
            name: { contains: query.search, mode: "insensitive" as const },
          },
        },
      },
      {
        candidate: {
          user: {
            email: { contains: query.search, mode: "insensitive" as const },
          },
        },
      },
    ];
  }

  const orderBy =
    query.sort === "oldest"
      ? { appliedAt: "asc" as const }
      : { appliedAt: "desc" as const };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      select: {
        id: true,
        status: true,
        appliedAt: true,
        updatedAt: true,
        candidate: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
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
    candidate: {
      id: app.candidate.id,
      name: app.candidate.user.name,
      email: app.candidate.user.email,
    },
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