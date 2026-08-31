import { z } from "zod";

export const createApplicationSchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
  resumeId: z.string().uuid("Invalid resume ID format"),
  coverLetter: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : null))
    .refine(
      (val) => val === null || (val.length >= 20 && val.length <= 3000),
      "Cover letter must be between 20 and 3000 characters"
    ),
});

export const applicationStatusUpdateSchema = z.object({
  status: z.enum([
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ] as const),
  comment: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : null))
    .refine(
      (val) => val === null || val.length <= 1000,
      "Comment must not exceed 1000 characters"
    ),
});

export const applicationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum([
      "APPLIED",
      "SCREENING",
      "SHORTLISTED",
      "INTERVIEW",
      "OFFER",
      "HIRED",
      "REJECTED",
    ] as const)
    .optional(),
  sort: z.enum(["newest", "oldest"] as const).default("newest"),
});

export type CreateApplicationRequest = z.infer<typeof createApplicationSchema>;
export type ApplicationStatusUpdateRequest = z.infer<
  typeof applicationStatusUpdateSchema
>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;