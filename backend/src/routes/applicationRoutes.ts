import { Router } from "express";
import * as applicationController from "../controllers/applicationController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Candidate routes
 */

// POST /api/applications - create application
router.post(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(applicationController.createApplication)
);

// GET /api/applications/mine - get candidate's applications
router.get(
  "/mine",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(applicationController.getMyApplications)
);

/**
 * Recruiter routes - specific routes before generic ones
 */

// GET /api/applications/job/:jobId - get job applications (specific route)
router.get(
  "/job/:jobId",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(applicationController.getJobApplications)
);

// GET /api/applications/:id/recruiter - recruiter view (specific route)
router.get(
  "/:id/recruiter",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(applicationController.getRecruiterApplication)
);

/**
 * Generic routes - registered after specific ones
 */

// GET /api/applications/:id - candidate view (generic route)
router.get(
  "/:id",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(applicationController.getApplication)
);

// PATCH /api/applications/:id/status - update status
router.patch(
  "/:id/status",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(applicationController.updateApplicationStatus)
);

export default router;