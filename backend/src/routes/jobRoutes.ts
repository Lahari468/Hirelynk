import { Router } from "express";
import * as jobController from "../controllers/jobController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Public routes
 */

// GET /api/jobs - search public jobs
router.get("/", asyncHandler(jobController.searchJobs));

// GET /api/jobs/:id - get single job (public)
router.get("/:id", asyncHandler(jobController.getJob));

/**
 * Recruiter routes - must come after public routes
 */

// GET /api/jobs/mine - get recruiter's own jobs
router.get(
  "/mine",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.getMyJobs)
);

// POST /api/jobs - create job
router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(jobController.createJob)
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