import { Router } from "express";
import * as recruiterDashboardController from "../controllers/recruiterDashboardController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Recruiter dashboard routes
 */

// GET /api/recruiters/dashboard
router.get(
  "/dashboard",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(recruiterDashboardController.getRecruiterDashboard)
);

// GET /api/recruiters/jobs/:jobId/applications
router.get(
  "/jobs/:jobId/applications",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(recruiterDashboardController.listJobApplications)
);

export default router;