import { Router } from "express";
import * as interviewController from "../controllers/interviewController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Recruiter routes
 */

// POST /api/interviews - create interview
router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(interviewController.createInterview)
);

// GET /api/interviews/mine - get user's interviews (both recruiter and candidate)
router.get(
  "/mine",
  authenticate,
  asyncHandler(interviewController.getMyInterviews)
);

/**
 * Generic routes - registered after specific ones to avoid conflicts
 */

// GET /api/interviews/:id - get single interview
router.get(
  "/:id",
  authenticate,
  asyncHandler(interviewController.getInterview)
);

// PATCH /api/interviews/:id - update interview (recruiter only)
router.patch(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(interviewController.updateInterview)
);

// PATCH /api/interviews/:id/cancel - cancel interview (recruiter only)
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(interviewController.cancelInterview)
);

// PATCH /api/interviews/:id/complete - complete interview (recruiter only)
router.patch(
  "/:id/complete",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(interviewController.completeInterview)
);

export default router;