import { Router } from "express";
import * as candidateController from "../controllers/candidateController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Candidate profile routes
 */

// GET /api/candidates/me
router.get(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(candidateController.getCandidateProfile)
);

// PUT /api/candidates/me
router.put(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(candidateController.updateCandidateProfile)
);

export default router;