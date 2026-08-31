import { prisma } from "../utils/prismaClient.js";
import {
  NotFoundError,
  ConflictError,
} from "../types/index.js";
import {
  saveResumeFile,
  deleteResumeFile,
} from "../utils/fileStorage.js";

interface ResumeResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: Date;
}

/**
 * Upload a resume for a candidate
 */
export const uploadResume = async (
  userId: string,
  file: Express.Multer.File
): Promise<ResumeResponse> => {
  // Get candidate profile
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  // Create resume record
  const resume = await prisma.resume.create({
    data: {
      candidateId: candidateProfile.id,
      fileName: file.originalname,
      fileUrl: "", // Will update after file is saved
      cloudinaryPublicId: null,
    },
  });

  // Save file and update fileUrl
  const fileUrl = await saveResumeFile(resume.id, file.buffer, file.originalname);

  const updated = await prisma.resume.update({
    where: { id: resume.id },
    data: { fileUrl },
  });

  return {
    id: updated.id,
    fileName: updated.fileName,
    fileUrl: updated.fileUrl,
    createdAt: updated.createdAt,
  };
};

/**
 * Get candidate's resumes
 */
export const getCandidateResumes = async (
  userId: string
): Promise<ResumeResponse[]> => {
  // Get candidate profile
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const resumes = await prisma.resume.findMany({
    where: { candidateId: candidateProfile.id },
    orderBy: { createdAt: "desc" },
  });

  return resumes.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    fileUrl: r.fileUrl,
    createdAt: r.createdAt,
  }));
};

/**
 * Get single candidate resume
 */
export const getCandidateResume = async (
  resumeId: string,
  userId: string
): Promise<ResumeResponse> => {
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  if (resume.candidateId !== candidateProfile.id) {
    throw new NotFoundError("Resume not found");
  }

  return {
    id: resume.id,
    fileName: resume.fileName,
    fileUrl: resume.fileUrl,
    createdAt: resume.createdAt,
  };
};

/**
 * Delete candidate resume
 */
export const deleteResume = async (
  resumeId: string,
  userId: string
): Promise<void> => {
  const candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId },
  });

  if (!candidateProfile) {
    throw new NotFoundError("Candidate profile not found");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { _count: { select: { applications: true } } },
  });

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  if (resume.candidateId !== candidateProfile.id) {
    throw new NotFoundError("Resume not found");
  }

  if (resume._count.applications > 0) {
    throw new ConflictError(
      "Cannot delete resume that has been used in applications"
    );
  }

  // Delete file
  await deleteResumeFile(resume.fileUrl);

  // Delete resume record
  await prisma.resume.delete({
    where: { id: resumeId },
  });
};

/**
 * Get recruiter access to a resume
 * (Only if candidate applied to recruiter's job with this resume)
 */
export const getRecruiterResumeAccess = async (
  resumeId: string,
  recruiterId: string
): Promise<ResumeResponse> => {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      applications: {
        include: {
          job: {
            select: { recruiterId: true },
          },
        },
      },
    },
  });

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  // Check if recruiter has access to this resume through applications
  const hasAccess = resume.applications.some(
    (app) => app.job?.recruiterId === recruiterId
  );

  if (!hasAccess) {
    throw new NotFoundError("Resume not found");
  }

  return {
    id: resume.id,
    fileName: resume.fileName,
    fileUrl: resume.fileUrl,
    createdAt: resume.createdAt,
  };
};