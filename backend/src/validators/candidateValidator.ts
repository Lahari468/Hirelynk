import { z } from "zod";

export const updateCandidateProfileSchema = z.object({
  headline: z.string().max(100).optional(),
  bio: z
    .string()
    .max(2000)
    .optional()
    .transform((val) => (val ? val.trim() : undefined))
    .refine(
      (val) => val === undefined || val.length > 0,
      "Bio cannot be empty"
    ),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format")
    .max(20)
    .optional(),
  location: z.string().max(100).optional(),
  experienceYears: z.coerce.number().int().min(0).max(70).optional(),
  education: z.string().max(500).optional(),
  linkedinUrl: z.string().url("Invalid URL format").max(500).optional().or(z.literal("")),
  githubUrl: z.string().url("Invalid URL format").max(500).optional().or(z.literal("")),
});

export type UpdateCandidateProfileRequest = z.infer<
  typeof updateCandidateProfileSchema
>;