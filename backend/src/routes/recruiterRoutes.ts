import { Router } from "express";
import * as recruiterController from "../controllers/recruiterController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Recruiter routes
 * All require authentication and RECRUITER role
 */

// GET /api/recruiters/me
router.get(
  "/me",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(recruiterController.getMyProfile)
);

// PUT /api/recruiters/me
router.put(
  "/me",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(recruiterController.updateMyProfile)
);

export default router;