import { z } from "zod";

export const savedJobIdSchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
});

export const savedJobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type SavedJobListQuery = z.infer<typeof savedJobListQuerySchema>;