import { z } from "zod";

export const updateRecruiterProfileSchema = z.object({
  jobTitle: z.string().max(100).optional(),
});

export type UpdateRecruiterProfileRequest = z.infer<
  typeof updateRecruiterProfileSchema
>;