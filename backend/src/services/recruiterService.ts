import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../types/index.js";
import { UpdateRecruiterProfileRequest } from "../validators/recruiterValidator.js";

const prisma = new PrismaClient();

interface RecruiterProfileData {
  id: string;
  userId: string;
  jobTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  company?: {
    id: string;
    name: string;
    location: string | null;
  };
}

/**
 * Get authenticated recruiter's profile
 */
export const getRecruiterProfile = async (
  userId: string
): Promise<RecruiterProfileData> => {
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
  });

  if (!recruiterProfile) {
    throw new NotFoundError("Recruiter profile not found");
  }

  return {
    id: recruiterProfile.id,
    userId: recruiterProfile.userId,
    jobTitle: recruiterProfile.jobTitle,
    createdAt: recruiterProfile.createdAt,
    updatedAt: recruiterProfile.updatedAt,
    user: recruiterProfile.user,
    company: recruiterProfile.company || undefined,
  };
};

/**
 * Update authenticated recruiter's profile
 */
export const updateRecruiterProfile = async (
  userId: string,
  data: UpdateRecruiterProfileRequest
): Promise<RecruiterProfileData> => {
  const recruiterProfile = await prisma.recruiterProfile.update({
    where: { userId },
    data: {
      jobTitle: data.jobTitle || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
  });

  return {
    id: recruiterProfile.id,
    userId: recruiterProfile.userId,
    jobTitle: recruiterProfile.jobTitle,
    createdAt: recruiterProfile.createdAt,
    updatedAt: recruiterProfile.updatedAt,
    user: recruiterProfile.user,
    company: recruiterProfile.company || undefined,
  };
};