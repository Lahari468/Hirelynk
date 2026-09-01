import { AsyncController } from "../types/index.js";
import {
  createJobSchema,
  updateJobSchema,
  publishJobSchema,
  closeJobSchema,
  publicJobListQuerySchema,
  recruiterJobListQuerySchema,
} from "../validators/jobValidator.js";
import * as jobService from "../services/jobService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/jobs
 * Create job (recruiter only)
 */
export const createJob: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = createJobSchema.parse(req.body);
  const job = await jobService.createJob(req.user.id, data);

  created(res, "Job created successfully", job);
};

/**
 * GET /api/jobs/mine
 * Get recruiter's jobs
 */
export const getMyJobs: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = recruiterJobListQuerySchema.parse(req.query);
  const result = await jobService.getRecruiterJobs(req.user.id, query);

  ok(res, "Jobs retrieved", result);
};

/**
 * GET /api/jobs
 * Get public jobs (public search & discovery)
 */
export const getPublicJobs: AsyncController = async (req, res) => {
  const query = publicJobListQuerySchema.parse(req.query);
  const result = await jobService.getPublicJobs(query);

  ok(res, "Jobs retrieved", result);
};

/**
 * GET /api/jobs/:id
 * Get single public job
 */
export const getJob: AsyncController = async (req, res) => {
  const { id } = req.params;
  const job = await jobService.getPublicJobById(id);

  ok(res, "Job retrieved", job);
};

/**
 * GET /api/jobs/:id/recruiter
 * Get recruiter's job details
 */
export const getRecruiterJob: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const job = await jobService.getRecruiterJobById(id, req.user.id);

  ok(res, "Job retrieved", job);
};

/**
 * PUT /api/jobs/:id
 * Update job (recruiter - own jobs only, DRAFT only)
 */
export const updateJob: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const data = updateJobSchema.parse(req.body);
  const job = await jobService.updateJob(id, req.user.id, data);

  ok(res, "Job updated successfully", job);
};

/**
 * PATCH /api/jobs/:id/publish
 * Publish job (DRAFT -> OPEN)
 */
export const publishJob: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  publishJobSchema.parse(req.body);
  const job = await jobService.publishJob(id, req.user.id);

  ok(res, "Job published successfully", job);
};

/**
 * PATCH /api/jobs/:id/close
 * Close job (OPEN -> CLOSED)
 */
export const closeJob: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  closeJobSchema.parse(req.body);
  const job = await jobService.closeJob(id, req.user.id);

  ok(res, "Job closed successfully", job);
};

/**
 * DELETE /api/jobs/:id
 * Delete job (DRAFT only)
 */
export const deleteJob: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  await jobService.deleteJob(id, req.user.id);

  ok(res, "Job deleted successfully");
};