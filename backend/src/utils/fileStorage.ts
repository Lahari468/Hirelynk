import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, "../../uploads/resumes");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Ensure uploads directory exists
 */
export const ensureUploadsDir = async (): Promise<void> => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create uploads directory:", err);
  }
};

/**
 * Save resume file
 */
export const saveResumeFile = async (
  resumeId: string,
  buffer: Buffer,
  originalName: string
): Promise<string> => {
  await ensureUploadsDir();

  const ext = path.extname(originalName);
  const fileName = `${resumeId}${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  await fs.writeFile(filePath, buffer);

  return `/uploads/resumes/${fileName}`;
};

/**
 * Delete resume file
 */
export const deleteResumeFile = async (fileUrl: string): Promise<void> => {
  try {
    if (!fileUrl.startsWith("/uploads/resumes/")) {
      return;
    }

    const fileName = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, fileName);

    await fs.unlink(filePath);
  } catch (err) {
    console.error("Failed to delete resume file:", err);
  }
};

/**
 * Validate file
 */
export const validateResumeFile = (
  file: Express.Multer.File | undefined
): string => {
  if (!file) {
    return "No file provided";
  }

  if (file.mimetype !== "application/pdf") {
    return "File must be a PDF";
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  return "";
};