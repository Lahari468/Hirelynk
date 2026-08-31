import { PrismaClient, JobStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../types/index.js";
import type {
  CreateJobRequest,
  UpdateJobRequest,
  JobSearchParams,
} from "../validators/jobValidator.js";

const prisma = new PrismaClient();

interface JobSkill {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  location: string | null;
  website: string | null;
}

interface JobResponse {
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
  createdAt: Date;
  updatedAt: Date;
  company: Company;
  skills: JobSkill[];
  applicationCount?: number;
}

/**
 * Create a new job for the authenticated recruiter
 */
export const createJob = async (
  recruiterId: string,
  data: CreateJobRequest
): Promise<JobResponse> => {
  // Get recruiter's profile and company
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: recruiterId },
    include: { company: true },
  });

  if (!recruiterProfile) {
    throw new NotFoundError("Recruiter profile not found");
  }

  if (!recruiterProfile.company) {
  throw new ValidationError("Recruiter must have a company to create jobs");
}

const companyId = recruiterProfile.company.id;

  // Validate skill IDs if provided
  if (data.skillIds.length > 0) {
    const skills = await prisma.skill.findMany({
      where: { id: { in: data.skillIds } },
    });

    if (skills.length !== data.skillIds.length) {
      throw new ValidationError("One or more skill IDs are invalid");
    }
  }

  // Create job with skills in transaction
  const result = await prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        employmentType: data.employmentType,
        experienceMin: data.experienceMin || null,
        experienceMax: data.experienceMax || null,
        salaryMin: data.salaryMin ? new Decimal(data.salaryMin) : null,
        salaryMax: data.salaryMax ? new Decimal(data.salaryMax) : null,
        status: "DRAFT" as JobStatus,
        companyId,
        recruiterId: recruiterId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            location: true,
            website: true,
          },
        },
      },
    });

    // Create job skills if provided
    if (data.skillIds.length > 0) {
      await Promise.all(
        data.skillIds.map((skillId) =>
          tx.jobSkill.create({
            data: {
              jobId: job.id,
              skillId,
            },
          })
        )
      );
    }

    return job;
  });

  // Fetch skills for response
  const skills = await prisma.jobSkill.findMany({
    where: { jobId: result.id },
    include: { skill: { select: { id: true, name: true } } },
  });

  return formatJobResponse(result, skills.map((js) => js.skill));
};

/**
 * Get a single job by ID (public - only OPEN jobs)
 */
export const getPublicJob = async (jobId: string): Promise<JobResponse> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          location: true,
          website: true,
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "OPEN") {
    throw new NotFoundError("Job not found");
  }

  const skills = await prisma.jobSkill.findMany({
    where: { jobId },
    include: { skill: { select: { id: true, name: true } } },
  });

  return formatJobResponse(job, skills.map((js) => js.skill));
};

/**
 * Get a recruiter's own job (including draft/closed)
 */
export const getRecruiterJob = async (
  jobId: string,
  recruiterId: string
): Promise<JobResponse> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          location: true,
          website: true,
        },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== recruiterId) {
    throw new NotFoundError("Job not found");
  }

  const skills = await prisma.jobSkill.findMany({
    where: { jobId },
    include: { skill: { select: { id: true, name: true } } },
  });

  const response = formatJobResponse(job, skills.map((js) => js.skill));
  response.applicationCount = job._count.applications;
  return response;
};

/**
 * Get recruiter's own jobs (paginated)
 */
export const getRecruiterJobs = async (
  recruiterId: string,
  page: number,
  limit: number,
  status?: JobStatus,
  search?: string,
  sort: "newest" | "oldest" | "salary_high" | "salary_low" = "newest"
): Promise<{
  items: JobResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { recruiterId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const orderBy = getJobOrderBy(sort);

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            location: true,
            website: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  const skillsByJob = await Promise.all(
    jobs.map((job) =>
      prisma.jobSkill.findMany({
        where: { jobId: job.id },
        include: { skill: { select: { id: true, name: true } } },
      })
    )
  );

  const items = jobs.map((job, index) => {
    const response = formatJobResponse(
      job,
      skillsByJob[index].map((js) => js.skill)
    );
    response.applicationCount = job._count.applications;
    return response;
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Search public jobs (only OPEN)
 */
export const searchPublicJobs = async (
  params: JobSearchParams
): Promise<{
  items: JobResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const skip = (params.page - 1) * params.limit;

  const where: Record<string, unknown> = { status: "OPEN" };

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

  if (params.location) {
    where.location = { contains: params.location, mode: "insensitive" as const };
  }

  if (params.employmentType) {
    where.employmentType = params.employmentType;
  }

  if (params.experienceMin !== undefined || params.experienceMax !== undefined) {
    const expWhere: Record<string, unknown> = {};
    if (params.experienceMin !== undefined) {
      expWhere.experienceMax = { gte: params.experienceMin };
    }
    if (params.experienceMax !== undefined) {
      expWhere.experienceMin = { lte: params.experienceMax };
    }
    where.AND = [expWhere];
  }

  const orderBy = getJobOrderBy(params.sort);

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            location: true,
            website: true,
          },
        },
      },
      orderBy,
      skip,
      take: params.limit,
    }),
    prisma.job.count({ where }),
  ]);

  // Handle skill filtering
  let filteredJobs = jobs;
  if (params.skills) {
    const skillNames = params.skills.split(",").map((s) => s.trim());
    const skillIds = await prisma.skill.findMany({
      where: { name: { in: skillNames, mode: "insensitive" as const } },
      select: { id: true },
    });

    const skillIdSet = new Set(skillIds.map((s) => s.id));

    const jobsWithSkills = await Promise.all(
      filteredJobs.map(async (job) => {
        const jobSkills = await prisma.jobSkill.findMany({
          where: { jobId: job.id },
        });
        const hasRequiredSkills = jobSkills.some((js) => skillIdSet.has(js.skillId));
        return hasRequiredSkills ? job : null;
      })
    );

    filteredJobs = jobsWithSkills.filter(
      (job) => job !== null
    ) as typeof jobs;
  }

  const skillsByJob = await Promise.all(
    filteredJobs.map((job) =>
      prisma.jobSkill.findMany({
        where: { jobId: job.id },
        include: { skill: { select: { id: true, name: true } } },
      })
    )
  );

  const items = filteredJobs.map((job, index) =>
    formatJobResponse(job, skillsByJob[index].map((js) => js.skill))
  );

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
 * Update a job (recruiter only)
 */
export const updateJob = async (
  jobId: string,
  recruiterId: string,
  data: UpdateJobRequest
): Promise<JobResponse> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== recruiterId) {
    throw new NotFoundError("Job not found");
  }

  // Validate skill IDs if provided
  if (data.skillIds && data.skillIds.length > 0) {
    const skills = await prisma.skill.findMany({
      where: { id: { in: data.skillIds } },
    });

    if (skills.length !== data.skillIds.length) {
      throw new ValidationError("One or more skill IDs are invalid");
    }
  }

  // Update job with skills in transaction
  const result = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.employmentType !== undefined)
      updateData.employmentType = data.employmentType;
    if (data.experienceMin !== undefined)
      updateData.experienceMin = data.experienceMin;
    if (data.experienceMax !== undefined)
      updateData.experienceMax = data.experienceMax;
    if (data.salaryMin !== undefined)
      updateData.salaryMin = data.salaryMin ? new Decimal(data.salaryMin) : null;
    if (data.salaryMax !== undefined)
      updateData.salaryMax = data.salaryMax ? new Decimal(data.salaryMax) : null;

    const updated = await tx.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            location: true,
            website: true,
          },
        },
      },
    });

    // Update skills if provided
    if (data.skillIds !== undefined) {
      await tx.jobSkill.deleteMany({ where: { jobId } });
      if (data.skillIds.length > 0) {
        await Promise.all(
          data.skillIds.map((skillId) =>
            tx.jobSkill.create({ data: { jobId, skillId } })
          )
        );
      }
    }

    return updated;
  });

  const skills = await prisma.jobSkill.findMany({
    where: { jobId: result.id },
    include: { skill: { select: { id: true, name: true } } },
  });

  return formatJobResponse(result, skills.map((js) => js.skill));
};

/**
 * Publish a job (DRAFT → OPEN)
 */
export const publishJob = async (
  jobId: string,
  recruiterId: string
): Promise<JobResponse> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          location: true,
          website: true,
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== recruiterId) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "DRAFT") {
    throw new ConflictError(
      `Cannot publish a job with status ${job.status}. Only DRAFT jobs can be published.`
    );
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { status: "OPEN" as JobStatus },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          location: true,
          website: true,
        },
      },
    },
  });

  const skills = await prisma.jobSkill.findMany({
    where: { jobId: updated.id },
    include: { skill: { select: { id: true, name: true } } },
  });

  return formatJobResponse(updated, skills.map((js) => js.skill));
};

/**
 * Close a job (OPEN → CLOSED)
 */
export const closeJob = async (
  jobId: string,
  recruiterId: string
): Promise<JobResponse> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          location: true,
          website: true,
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== recruiterId) {
    throw new NotFoundError("Job not found");
  }

  if (job.status === "CLOSED") {
    throw new ConflictError("Job is already closed");
  }

  if (job.status !== "OPEN") {
    throw new ConflictError(
      `Cannot close a job with status ${job.status}. Only OPEN jobs can be closed.`
    );
  }

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { status: "CLOSED" as JobStatus },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          location: true,
          website: true,
        },
      },
    },
  });

  const skills = await prisma.jobSkill.findMany({
    where: { jobId: updated.id },
    include: { skill: { select: { id: true, name: true } } },
  });

  return formatJobResponse(updated, skills.map((js) => js.skill));
};

/**
 * Delete a job (only DRAFT)
 */
export const deleteJob = async (
  jobId: string,
  recruiterId: string
): Promise<void> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.recruiterId !== recruiterId) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "DRAFT") {
    throw new ConflictError(
      `Cannot delete a job with status ${job.status}. Only DRAFT jobs can be deleted.`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.jobSkill.deleteMany({ where: { jobId } });
    await tx.job.delete({ where: { id: jobId } });
  });
};

/**
 * Helper: Format job response
 */
function formatJobResponse(job: any, skills: JobSkill[]): JobResponse {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    employmentType: job.employmentType,
    experienceMin: job.experienceMin,
    experienceMax: job.experienceMax,
    salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
    salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    company: job.company,
    skills,
  };
}

/**
 * Helper: Get order by clause
 */
function getJobOrderBy(
  sort: "newest" | "oldest" | "salary_high" | "salary_low"
): Record<string, string> {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "salary_high":
      return { salaryMax: "desc" };
    case "salary_low":
      return { salaryMin: "asc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}