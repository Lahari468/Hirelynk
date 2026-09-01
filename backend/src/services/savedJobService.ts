import { prisma } from "../utils/prismaClient.js";
import { NotFoundError, ConflictError } from "../types/index.js";
import type { SavedJobListQuery } from "../validators/savedJobValidator.js";

interface SavedJobResponse {
  id: string;
  jobId: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  experienceMin: number | null;
  experienceMax: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  status: string;
  company: {
    id: string;
    name: string;
  };
  recruiter: {
    id: string;
    name: string;
  };
  savedAt: Date;
}

interface PaginatedSavedJobs {
  items: SavedJobResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Save a job for candidate
 */
export const saveJob = async (
  userId: string,
  jobId: string
): Promise<SavedJobResponse> => {
  // Get candidate profile
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  // Get job
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
    throw new ConflictError("Can only save open jobs");
  }

  // Check if already saved
  const existing = await prisma.savedJob.findUnique({
    where: {
      candidateId_jobId: {
        candidateId: candidateProfile.id,
        jobId,
      },
    },
  });

  if (existing) {
    throw new ConflictError("You have already saved this job");
  }

  // Save job
  await prisma.savedJob.create({
    data: {
      candidateId: candidateProfile.id,
      jobId,
    },
  });

  return {
    id: jobId,
    jobId,
    title: job.title,
    description: job.description,
    location: job.location,
    employmentType: job.employmentType,
    experienceMin: job.experienceMin ? Number(job.experienceMin) : null,
    experienceMax: job.experienceMax ? Number(job.experienceMax) : null,
    salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
    salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
    status: job.status,
    company: job.company,
    recruiter: job.recruiter,
    savedAt: new Date(),
  };
};

/**
 * Unsave a job for candidate
 */
export const unsaveJob = async (
  userId: string,
  jobId: string
): Promise<void> => {
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const savedJob = await prisma.savedJob.findUnique({
    where: {
      candidateId_jobId: {
        candidateId: candidateProfile.id,
        jobId,
      },
    },
  });

  if (!savedJob) {
    throw new NotFoundError("Saved job not found");
  }

  await prisma.savedJob.delete({
    where: { id: savedJob.id },
  });
};

/**
 * Get candidate's saved jobs
 */
export const getSavedJobs = async (
  userId: string,
  query: SavedJobListQuery
): Promise<PaginatedSavedJobs> => {
  const skip = (query.page - 1) * query.limit;

  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const [savedJobs, total] = await Promise.all([
    prisma.savedJob.findMany({
      where: { candidateId: candidateProfile.id },
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true } },
            recruiter: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" as const },
      skip,
      take: query.limit,
    }),
    prisma.savedJob.count({ where: { candidateId: candidateProfile.id } }),
  ]);

  const items: SavedJobResponse[] = savedJobs.map((saved) => ({
    id: saved.job.id,
    jobId: saved.job.id,
    title: saved.job.title,
    description: saved.job.description,
    location: saved.job.location,
    employmentType: saved.job.employmentType,
    experienceMin: saved.job.experienceMin ? Number(saved.job.experienceMin) : null,
    experienceMax: saved.job.experienceMax ? Number(saved.job.experienceMax) : null,
    salaryMin: saved.job.salaryMin ? Number(saved.job.salaryMin) : null,
    salaryMax: saved.job.salaryMax ? Number(saved.job.salaryMax) : null,
    status: saved.job.status,
    company: saved.job.company,
    recruiter: saved.job.recruiter,
    savedAt: saved.createdAt,
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
 * Check if job is saved by candidate
 */
export const isJobSaved = async (
  userId: string,
  jobId: string
): Promise<boolean> => {
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const saved = await prisma.savedJob.findUnique({
    where: {
      candidateId_jobId: {
        candidateId: candidateProfile.id,
        jobId,
      },
    },
  });

  return !!saved;
};