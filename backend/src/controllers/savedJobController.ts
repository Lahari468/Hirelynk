import { AsyncController } from "../types/index.js";
import {
  savedJobIdSchema,
  savedJobListQuerySchema,
} from "../validators/savedJobValidator.js";
import * as savedJobService from "../services/savedJobService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/candidates/me/saved-jobs/:jobId
 * Save a job
 */
export const saveJob: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { jobId } = savedJobIdSchema.parse({ jobId: req.params.jobId });
  const result = await savedJobService.saveJob(req.user.id, jobId);

  created(res, "Job saved successfully", result);
};

/**
 * DELETE /api/candidates/me/saved-jobs/:jobId
 * Unsave a job
 */
export const unsaveJob: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { jobId } = savedJobIdSchema.parse({ jobId: req.params.jobId });
  await savedJobService.unsaveJob(req.user.id, jobId);

  ok(res, "Job removed from saved");
};

/**
 * GET /api/candidates/me/saved-jobs
 * List saved jobs
 */
export const getSavedJobs: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = savedJobListQuerySchema.parse(req.query);
  const result = await savedJobService.getSavedJobs(req.user.id, query);

  ok(res, "Saved jobs retrieved", result);
};

/**
 * GET /api/candidates/me/saved-jobs/:jobId
 * Check if job is saved
 */
export const checkSavedStatus: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { jobId } = savedJobIdSchema.parse({ jobId: req.params.jobId });
  const saved = await savedJobService.isJobSaved(req.user.id, jobId);

  ok(res, "Saved status retrieved", { saved });
};