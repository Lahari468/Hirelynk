import { NotFoundError } from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import type {
  AdminUserListQuery,
  AdminJobListQuery,
  AdminAuditLogListQuery,
} from "../validators/adminValidator.js";

interface DashboardStats {
  totalUsers: number;
  candidateCount: number;
  recruiterCount: number;
  adminCount: number;
  totalCompanies: number;
  totalJobs: number;
  openJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
}

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

interface JobListItem {
  id: string;
  title: string;
  company: { id: string; name: string };
  recruiter: { id: string; name: string };
  location: string;
  status: string;
  applicationCount: number;
  createdAt: Date;
}

interface AuditLogItem {
  id: string;
  user: { id: string; name: string } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [
    totalUsers,
    candidateCount,
    recruiterCount,
    adminCount,
    totalCompanies,
    totalJobs,
    jobsByStatus,
    totalApplications,
    applicationsByStatus,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.candidateProfile.count(),
    prisma.recruiterProfile.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.company.count(),
    prisma.job.count(),
    prisma.job.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.application.count(),
    prisma.application.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const jobStats: Record<string, number> = {
    DRAFT: 0,
    OPEN: 0,
    CLOSED: 0,
  };

  jobsByStatus.forEach((stat) => {
    jobStats[stat.status] = stat._count;
  });

  const appStats: Record<string, number> = {};
  applicationsByStatus.forEach((stat) => {
    appStats[stat.status] = stat._count;
  });

  return {
    totalUsers,
    candidateCount,
    recruiterCount,
    adminCount,
    totalCompanies,
    totalJobs,
    openJobs: jobStats["OPEN"] || 0,
    draftJobs: jobStats["DRAFT"] || 0,
    closedJobs: jobStats["CLOSED"] || 0,
    totalApplications,
    applicationsByStatus: appStats,
  };
};

/**
 * List users with pagination and filters
 */
export const listUsers = async (
  params: AdminUserListQuery
): Promise<PaginatedResponse<UserListItem>> => {
  const skip = (params.page - 1) * params.limit;

  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" as const } },
      { email: { contains: params.search, mode: "insensitive" as const } },
    ];
  }

  if (params.role) {
    where.role = params.role;
  }

  const orderBy = getOrderBy(params.sort);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy,
      skip,
      take: params.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users as UserListItem[],
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

/**
 * Get single user details
 */
export const getUserDetails = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      candidateProfile: {
        select: {
          id: true,
          headline: true,
          location: true,
        },
      },
      recruiterProfile: {
        select: {
          id: true,
          jobTitle: true,
          company: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

/**
 * List jobs with pagination and filters
 */
export const listJobs = async (
  params: AdminJobListQuery
): Promise<PaginatedResponse<JobListItem>> => {
  const skip = (params.page - 1) * params.limit;

  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" as const } },
      { description: { contains: params.search, mode: "insensitive" as const } },
      {
        company: {
          name: { contains: params.search, mode: "insensitive" as const },
        },
      },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.employmentType) {
    where.employmentType = params.employmentType;
  }

  const orderBy = getJobOrderBy(params.sort);

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy,
      skip,
      take: params.limit,
    }),
    prisma.job.count({ where }),
  ]);

  const items: JobListItem[] = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    recruiter: job.recruiter,
    location: job.location,
    status: job.status,
    applicationCount: job._count.applications,
    createdAt: job.createdAt,
  }));

  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

/**
 * Get single job details
 */
export const getJobDetails = async (jobId: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: true,
      recruiter: { select: { id: true, name: true, email: true } },
      _count: {
        select: { applications: true, skills: true },
      },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  return job;
};

/**
 * List audit logs with pagination and filters
 */
export const listAuditLogs = async (
  params: AdminAuditLogListQuery
): Promise<PaginatedResponse<AuditLogItem>> => {
  const skip = (params.page - 1) * params.limit;

  const where: Record<string, unknown> = {};

  if (params.action) {
    where.action = params.action;
  }

  if (params.entityType) {
    where.entityType = { contains: params.entityType, mode: "insensitive" as const };
  }

  const orderBy = params.sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy,
      skip,
      take: params.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const items: AuditLogItem[] = logs.map((log) => ({
    id: log.id,
    user: log.user,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    createdAt: log.createdAt,
  }));

  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

/**
 * Helper: Get order by clause for users
 */
function getOrderBy(sort: "newest" | "oldest" | "name") {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" as const };
    case "name":
      return { name: "asc" as const };
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

/**
 * Helper: Get order by clause for jobs
 */
function getJobOrderBy(sort: "newest" | "oldest" | "salary_high" | "salary_low") {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" as const };
    case "salary_high":
      return { salaryMax: "desc" as const };
    case "salary_low":
      return { salaryMin: "asc" as const };
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

export const listRecruiters = async (params: { page: number; limit: number; search?: string; }) : Promise<PaginatedResponse<{ id: string; name: string; email: string; company?: { id: string; name: string } | null; jobTitle?: string | null; createdAt: Date; }>> => {
  const skip = (params.page - 1) * params.limit;

  const where: Record<string, any> = {};

  if (params.search) {
    where.OR = [
      { user: { name: { contains: params.search, mode: "insensitive" as const } } },
      { company: { name: { contains: params.search, mode: "insensitive" as const } } },
      { jobTitle: { contains: params.search, mode: "insensitive" as const } },
    ];
  }

  const [profiles, total] = await Promise.all([
    prisma.recruiterProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        company: { select: { id: true, name: true } },
      },
      skip,
      take: params.limit,
    }),
    prisma.recruiterProfile.count({ where }),
  ]);

  const items = profiles.map((p) => ({
    id: p.user.id,
    name: p.user.name,
    email: p.user.email,
    company: p.company || null,
    jobTitle: p.jobTitle || null,
    createdAt: p.user.createdAt,
  }));

  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

export const listCompanies = async (params: { page: number; limit: number; search?: string; }) : Promise<PaginatedResponse<{ id: string; name: string; location?: string | null; createdAt: Date }>> => {
  const skip = (params.page - 1) * params.limit;

  const where: Record<string, any> = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" as const } },
      { location: { contains: params.search, mode: "insensitive" as const } },
    ];
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({ where, skip, take: params.limit }),
    prisma.company.count({ where }),
  ]);

  const items = companies.map((c) => ({ id: c.id, name: c.name, location: c.location, createdAt: c.createdAt }));

  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};

export const deleteUser = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  await prisma.user.delete({ where: { id: userId } });
};

export const deleteJob = async (jobId: string): Promise<void> => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new NotFoundError("Job not found");
  await prisma.job.delete({ where: { id: jobId } });
};
