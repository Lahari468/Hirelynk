import multer from "multer";
import { ValidationError } from "../types/index.js";
import { validateResumeFile } from "../utils/fileStorage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/**
 * Middleware to handle resume file upload
 */
export const uploadResumeFile = upload.single("resume");

/**
 * Middleware to validate uploaded resume file
 */
export const validateUploadedFile = (
  req: any,
  _res: any,
  next: any
): void => {
  const error = validateResumeFile(req.file);
  if (error) {
    throw new ValidationError(error);
  }
  next();
};