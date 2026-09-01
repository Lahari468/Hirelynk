import { Router } from "express";
import * as savedJobController from "../controllers/savedJobController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Saved jobs routes
 */

// POST /api/candidates/me/saved-jobs/:jobId
router.post(
  "/:jobId",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(savedJobController.saveJob)
);

// GET /api/candidates/me/saved-jobs (specific route before generic :jobId)
router.get(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(savedJobController.getSavedJobs)
);

// GET /api/candidates/me/saved-jobs/:jobId
router.get(
  "/:jobId",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(savedJobController.checkSavedStatus)
);

// DELETE /api/candidates/me/saved-jobs/:jobId
router.delete(
  "/:jobId",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(savedJobController.unsaveJob)
);

export default router;