import { prisma } from "../utils/prismaClient.js";
import { NotFoundError } from "../types/index.js";
import type { UpdateCandidateProfileRequest } from "../validators/candidateValidator.js";

interface CandidateProfileResponse {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  experienceYears: number | null;
  education: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Get candidate profile
 */
export const getCandidateProfile = async (
  userId: string
): Promise<CandidateProfileResponse> => {
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  return candidateProfile as CandidateProfileResponse;
};

/**
 * Update candidate profile
 */
export const updateCandidateProfile = async (
  userId: string,
  data: UpdateCandidateProfileRequest
): Promise<CandidateProfileResponse> => {
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  // Build update data with only provided fields
  const updateData: Record<string, unknown> = {};

  if (data.headline !== undefined) {
    updateData.headline = data.headline || null;
  }
  if (data.bio !== undefined) {
    updateData.bio = data.bio || null;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone || null;
  }
  if (data.location !== undefined) {
    updateData.location = data.location || null;
  }
  if (data.experienceYears !== undefined) {
    updateData.experienceYears = data.experienceYears || null;
  }
  if (data.education !== undefined) {
    updateData.education = data.education || null;
  }
  if (data.linkedinUrl !== undefined) {
    updateData.linkedinUrl = data.linkedinUrl || null;
  }
  if (data.githubUrl !== undefined) {
    updateData.githubUrl = data.githubUrl || null;
  }

  const updated = await prisma.candidateProfile.update({
    where: { userId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updated as CandidateProfileResponse;
};