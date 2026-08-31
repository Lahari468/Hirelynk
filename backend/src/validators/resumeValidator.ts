import { z } from "zod";

export const uploadResumeSchema = z.object({
  // file is handled by multer middleware, not in body
});

export const resumeIdSchema = z.object({
  id: z.string().uuid("Invalid resume ID format"),
});

export type ResumeIdRequest = z.infer<typeof resumeIdSchema>;