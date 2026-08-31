import { AsyncController } from "../types/index.js";
import * as resumeService from "../services/resumeService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/candidates/me/resumes
 * Upload a resume (candidate only)
 */
export const uploadResume: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "No file provided",
    });
    return;
  }

  const resume = await resumeService.uploadResume(req.user.id, req.file);

  created(res, "Resume uploaded successfully", resume);
};

/**
 * GET /api/candidates/me/resumes
 * Get candidate's resumes
 */
export const getCandidateResumes: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const resumes = await resumeService.getCandidateResumes(req.user.id);

  ok(res, "Resumes retrieved", resumes);
};

/**
 * GET /api/candidates/me/resumes/:id
 * Get single resume
 */
export const getResume: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const resume = await resumeService.getCandidateResume(id, req.user.id);

  ok(res, "Resume retrieved", resume);
};

/**
 * DELETE /api/candidates/me/resumes/:id
 * Delete resume
 */
export const deleteResume: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  await resumeService.deleteResume(id, req.user.id);

  ok(res, "Resume deleted successfully");
};

/**
 * GET /api/recruiters/resumes/:id
 * Get resume as recruiter (if authorized through applications)
 */
export const getRecruiterResume: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const resume = await resumeService.getRecruiterResumeAccess(id, req.user.id);

  ok(res, "Resume retrieved", resume);
};