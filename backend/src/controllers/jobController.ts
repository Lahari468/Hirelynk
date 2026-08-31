import { AsyncController } from "../types/index.js";
import {
  createJobSchema,
  updateJobSchema,
  jobSearchSchema,
} from "../validators/jobValidator.js";
import * as jobService from "../services/jobService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/jobs
 * Create a new job (recruiter only)
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
 * Get recruiter's own jobs (recruiter only)
 */
export const getMyJobs: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit as string, 10) || 10)
  );
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const sort = (req.query.sort as "newest" | "oldest" | "salary_high" | "salary_low") || "newest";

  const result = await jobService.getRecruiterJobs(
    req.user.id,
    page,
    limit,
    status ? (status.toUpperCase() as any) : undefined,
    search,
    sort
  );

  ok(res, "Jobs retrieved", result);
};

/**
 * GET /api/jobs
 * Search public jobs (open to all)
 */
export const searchJobs: AsyncController = async (req, res) => {
  const params = jobSearchSchema.parse(req.query);
  const result = await jobService.searchPublicJobs(params);

  ok(res, "Jobs retrieved", result);
};

/**
 * GET /api/jobs/:id
 * Get single job (public - only open jobs)
 */
export const getJob: AsyncController = async (req, res) => {
  const { id } = req.params;
  const job = await jobService.getPublicJob(id);

  ok(res, "Job retrieved", job);
};

/**
 * PUT /api/jobs/:id
 * Update a job (recruiter only)
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
 * Publish a job (DRAFT → OPEN)
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
  const job = await jobService.publishJob(id, req.user.id);

  ok(res, "Job published successfully", job);
};

/**
 * PATCH /api/jobs/:id/close
 * Close a job (OPEN → CLOSED)
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
  const job = await jobService.closeJob(id, req.user.id);

  ok(res, "Job closed successfully", job);
};

/**
 * DELETE /api/jobs/:id
 * Delete a job (draft only)
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