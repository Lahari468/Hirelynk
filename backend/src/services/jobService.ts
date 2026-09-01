import { JobStatus, Prisma } from "@prisma/client";
import { NotFoundError, ConflictError } from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import type {
  CreateJobRequest,
  UpdateJobRequest,
  PublicJobListQuery,
  RecruiterJobListQuery,
} from "../validators/jobValidator.js";

interface JobListItem {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  experienceMin: number | null;
  experienceMax: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  status: JobStatus;
  companyId: string;
  recruiterId: string;
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
  recruiter: {
    id: string;
    name: string;
  };
}

interface PaginatedJobs {
  items: JobListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type JobWithRelations = Prisma.JobGetPayload<{
  include: {
    company: { select: { id: true; name: true } };
    recruiter: { select: { id: true; name: true } };
  };
}>;

const mapJobToListItem = (job: JobWithRelations): JobListItem => ({
  id: job.id,
  title: job.title,
  description: job.description,
  location: job.location,
  employmentType: job.employmentType,
  experienceMin: job.experienceMin !== null ? Number(job.experienceMin) : null,
  experienceMax: job.experienceMax !== null ? Number(job.experienceMax) : null,
  salaryMin: job.salaryMin !== null ? Number(job.salaryMin) : null,
  salaryMax: job.salaryMax !== null ? Number(job.salaryMax) : null,
  status: job.status,
  companyId: job.companyId,
  recruiterId: job.recruiterId,
  createdAt: job.createdAt,
  company: job.company,
  recruiter: job.recruiter,
});

/**
 * Create a job (DRAFT status)
 */
export const createJob = async (
  userId: string,
  data: CreateJobRequest
): Promise<JobListItem> => {
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId },
  });

  if (!recruiterProfile) {
    throw new NotFoundError("Recruiter profile not found");
  }

  if (!recruiterProfile.companyId) {
    throw new ConflictError("Recruiter must belong to a company before creating jobs");
  }

  const job = await prisma.job.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      employmentType: data.employmentType,
      experienceMin: data.experienceRequired ?? null,
      experienceMax: data.experienceRequired ?? null,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      status: "DRAFT" as JobStatus,
      companyId: recruiterProfile.companyId,
      recruiterId: userId,
    },
    include: {
      company: { select: { id: true, name: true } },
      recruiter: { select: { id: true, name: true } },
    },
  });

  return mapJobToListItem(job);
};

/**
 * Get recruiter's jobs with filters
 */
export const getRecruiterJobs = async (
  userId: string,
  query: RecruiterJobListQuery
): Promise<PaginatedJobs> => {
  const skip = (query.page - 1) * query.limit;

  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId },
  });

  if (!recruiterProfile) {
    throw new NotFoundError("Recruiter profile not found");
  }

  const where: Record<string, unknown> = {
    recruiterId: userId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" as const } },
      {
        description: {
          contains: query.search,
          mode: "insensitive" as const,
        },
      },
    ];
  }

  const orderBy = getRecruiterOrderBy(query.sort);

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
      },
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    items: jobs.map(mapJobToListItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get public jobs with advanced search and filtering
 */
export const getPublicJobs = async (
  query: PublicJobListQuery
): Promise<PaginatedJobs> => {
  const skip = (query.page - 1) * query.limit;

  const where: Record<string, unknown> = {
    status: "OPEN" as JobStatus,
  };

  // Search: title or description
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" as const } },
      {
        description: {
          contains: query.search,
          mode: "insensitive" as const,
        },
      },
    ];
  }

  // Location filter
  if (query.location) {
    where.location = {
      contains: query.location,
      mode: "insensitive" as const,
    };
  }

  // Employment type filter
  if (query.employmentType) {
    where.employmentType = query.employmentType;
  }

  // Experience range filter (overlap logic)
  if (query.experienceMin !== undefined || query.experienceMax !== undefined) {
    const expWhere: Record<string, unknown> = {};

    if (query.experienceMin !== undefined) {
      expWhere.experienceMin = {
        gte: query.experienceMin,
      };
    }

    if (query.experienceMax !== undefined) {
      if (expWhere.experienceMin) {
        expWhere.experienceMin = {
          ...(expWhere.experienceMin as Record<string, unknown>),
          lte: query.experienceMax,
        };
      } else {
        expWhere.experienceMin = {
          lte: query.experienceMax,
        };
      }
    }

    where.AND = [expWhere];
  }

  // Salary range filter
  if (query.salaryMin !== undefined || query.salaryMax !== undefined) {
    const salaryWhere: Record<string, unknown>[] = [];

    if (query.salaryMin !== undefined) {
      salaryWhere.push({
        salaryMax: {
          gte: query.salaryMin,
        },
      });
    }

    if (query.salaryMax !== undefined) {
      salaryWhere.push({
        salaryMin: {
          lte: query.salaryMax,
        },
      });
    }

    if (salaryWhere.length > 0) {
      where.AND = [
        ...(Array.isArray(where.AND) ? (where.AND as Record<string, unknown>[]) : []),
        ...salaryWhere,
      ];
    }
  }

  // Company filter
  if (query.companyId) {
    where.companyId = query.companyId;
  }

  const orderBy =
    query.sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
      },
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    items: jobs.map(mapJobToListItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get single job by ID (public - only OPEN jobs)
 */
export const getPublicJobById = async (jobId: string): Promise<JobListItem> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: { select: { id: true, name: true } },
      recruiter: { select: { id: true, name: true } },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "OPEN") {
    throw new NotFoundError("Job not found");
  }

  return mapJobToListItem(job);
};

/**
 * Get single job by ID (recruiter - own jobs only)
 */
export const getRecruiterJobById = async (
  jobId: string,
  userId: string
): Promise<JobListItem> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: { select: { id: true, name: true } },
      recruiter: { select: { id: true, name: true } },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== userId) {
    throw new NotFoundError("Job not found");
  }

  return mapJobToListItem(job);
};

/**
 * Update job (recruiter - own jobs only)
 */
export const updateJob = async (
  jobId: string,
  userId: string,
  data: UpdateJobRequest
): Promise<JobListItem> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== userId) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "DRAFT") {
    throw new ConflictError("Can only edit DRAFT jobs");
  }

  const updateData: Prisma.JobUpdateInput = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.location !== undefined && { location: data.location }),
    ...(data.employmentType !== undefined && {
      employmentType: data.employmentType,
    }),
    ...(data.salaryMin !== undefined && { salaryMin: data.salaryMin }),
    ...(data.salaryMax !== undefined && { salaryMax: data.salaryMax }),
  };

  if (data.experienceRequired !== undefined) {
    updateData.experienceMin = data.experienceRequired;
    updateData.experienceMax = data.experienceRequired;
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: updateData,
    include: {
      company: { select: { id: true, name: true } },
      recruiter: { select: { id: true, name: true } },
    },
  });

  return mapJobToListItem(updated);
};

/**
 * Publish job (DRAFT -> OPEN)
 */
export const publishJob = async (
  jobId: string,
  userId: string
): Promise<JobListItem> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== userId) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "DRAFT") {
    throw new ConflictError("Can only publish DRAFT jobs");
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { status: "OPEN" as JobStatus },
    include: {
      company: { select: { id: true, name: true } },
      recruiter: { select: { id: true, name: true } },
    },
  });

  return mapJobToListItem(updated);
};

/**
 * Close job (OPEN -> CLOSED)
 */
export const closeJob = async (
  jobId: string,
  userId: string
): Promise<JobListItem> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== userId) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "OPEN") {
    throw new ConflictError("Can only close OPEN jobs");
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { status: "CLOSED" as JobStatus },
    include: {
      company: { select: { id: true, name: true } },
      recruiter: { select: { id: true, name: true } },
    },
  });

  return mapJobToListItem(updated);
};

/**
 * Delete job (DRAFT only)
 */
export const deleteJob = async (
  jobId: string,
  userId: string
): Promise<void> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== userId) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "DRAFT") {
    throw new ConflictError("Can only delete DRAFT jobs");
  }

  await prisma.job.delete({
    where: { id: jobId },
  });
};

/**
 * Helper: Get order by clause for recruiter jobs
 */
function getRecruiterOrderBy(
  sort: "newest" | "oldest" | "salary_high" | "salary_low"
) {
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