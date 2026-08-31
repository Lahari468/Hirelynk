import { Router } from "express";
import * as resumeController from "../controllers/resumeController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { uploadResumeFile, validateUploadedFile } from "../middleware/uploadResume.js";

const router = Router();

/**
 * Candidate resume routes
 */

// POST /api/candidates/me/resumes
router.post(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  uploadResumeFile,
  validateUploadedFile,
  asyncHandler(resumeController.uploadResume)
);

// GET /api/candidates/me/resumes
router.get(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(resumeController.getCandidateResumes)
);

// GET /api/candidates/me/resumes/:id
router.get(
  "/:id",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(resumeController.getResume)
);

// DELETE /api/candidates/me/resumes/:id
router.delete(
  "/:id",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(resumeController.deleteResume)
);

export default router;