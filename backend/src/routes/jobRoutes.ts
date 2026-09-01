import { Router } from "express";
import * as jobController from "../controllers/jobController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Recruiter job management routes
 */

// POST /api/jobs - create job
router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.createJob)
);

// GET /api/jobs/mine - get recruiter's jobs (specific route before dynamic)
router.get(
  "/mine",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.getMyJobs)
);

/**
 * Public job discovery routes
 */

// GET /api/jobs - public job listing with search/filtering
router.get(
  "/",
  asyncHandler(jobController.getPublicJobs)
);

/**
 * Recruiter job details routes (specific routes before generic :id)
 */

// GET /api/jobs/:id/recruiter - recruiter's job details
router.get(
  "/:id/recruiter",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.getRecruiterJob)
);

/**
 * Generic job routes
 */

// GET /api/jobs/:id - public job details
router.get(
  "/:id",
  asyncHandler(jobController.getJob)
);

// PUT /api/jobs/:id - update job
router.put(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.updateJob)
);

// PATCH /api/jobs/:id/publish - publish job
router.patch(
  "/:id/publish",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.publishJob)
);

// PATCH /api/jobs/:id/close - close job
router.patch(
  "/:id/close",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.closeJob)
);

// DELETE /api/jobs/:id - delete job
router.delete(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.deleteJob)
);

export default router;