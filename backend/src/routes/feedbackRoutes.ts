import { Router } from "express";
import * as feedbackController from "../controllers/feedbackController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// POST /api/feedback - submit feedback for a legitimate recruitment relationship
router.post(
  "/",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  asyncHandler(feedbackController.createFeedback)
);

// GET /api/feedback - list feedback the user is entitled to see
router.get(
  "/",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  asyncHandler(feedbackController.listFeedback)
);

/**
 * Generic routes - registered after specific ones to avoid conflicts
 */

// GET /api/feedback/:id - get single feedback entry
router.get(
  "/:id",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  asyncHandler(feedbackController.getFeedback)
);

// PATCH /api/feedback/:id - update own feedback
router.patch(
  "/:id",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  asyncHandler(feedbackController.updateFeedback)
);

export default router;