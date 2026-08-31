import { Router } from "express";
import * as resumeController from "../controllers/resumeController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Recruiter resume access routes
 */

// GET /api/recruiters/resumes/:id
router.get(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(resumeController.getRecruiterResume)
);

export default router;