import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  location: z.string().min(2).max(100),
  employmentType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "INTERNSHIP",
    "CONTRACT",
  ] as const),
  experienceRequired: z.coerce.number().int().min(0).max(50).optional(),
  salaryMin: z.coerce.number().positive().optional(),
  salaryMax: z.coerce.number().positive().optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const publishJobSchema = z.object({
  // No fields required for publishing
});

export const closeJobSchema = z.object({
  // No fields required for closing
});

export const publicJobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional().transform((val) =>
    val ? val.trim() : undefined
  ),
  location: z.string().optional().transform((val) =>
    val ? val.trim() : undefined
  ),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"] as const)
    .optional(),
  experienceMin: z.coerce.number().int().min(0).max(50).optional(),
  experienceMax: z.coerce.number().int().min(0).max(50).optional(),
  salaryMin: z.coerce.number().positive().optional(),
  salaryMax: z.coerce.number().positive().optional(),
  companyId: z.string().uuid().optional(),
  sort: z.enum(["newest", "oldest"] as const).default("newest"),
});

export const recruiterJobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum(["DRAFT", "OPEN", "CLOSED"] as const)
    .optional(),
  search: z.string().optional().transform((val) =>
    val ? val.trim() : undefined
  ),
  sort: z.enum(["newest", "oldest", "salary_high", "salary_low"] as const)
    .default("newest"),
});

export type CreateJobRequest = z.infer<typeof createJobSchema>;
export type UpdateJobRequest = z.infer<typeof updateJobSchema>;
export type PublicJobListQuery = z.infer<typeof publicJobListQuerySchema>;
export type RecruiterJobListQuery = z.infer<typeof recruiterJobListQuerySchema>;