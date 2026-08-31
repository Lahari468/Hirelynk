import { z } from "zod";

export const createJobSchema = z
  .object({
    title: z
      .string()
      .min(5, "Job title must be at least 5 characters")
      .max(200, "Job title is too long"),
    description: z
      .string()
      .min(20, "Job description must be at least 20 characters")
      .max(5000, "Job description is too long"),
    location: z
      .string()
      .min(2, "Location is required")
      .max(200, "Location is too long"),
    employmentType: z.enum([
      "FULL_TIME",
      "PART_TIME",
      "INTERNSHIP",
      "CONTRACT",
    ] as const),
    experienceMin: z.number().int().min(0).optional(),
    experienceMax: z.number().int().min(0).optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    skillIds: z
      .array(z.string().uuid("Invalid skill ID format"))
      .optional()
      .default([]),
  })
  .refine(
    (data) =>
      data.experienceMax === undefined ||
      data.experienceMin === undefined ||
      data.experienceMin <= data.experienceMax,
    {
      message: "experienceMin must be less than or equal to experienceMax",
      path: ["experienceMin"],
    }
  )
  .refine(
    (data) =>
      data.salaryMax === undefined ||
      data.salaryMin === undefined ||
      data.salaryMin <= data.salaryMax,
    {
      message: "salaryMin must be less than or equal to salaryMax",
      path: ["salaryMin"],
    }
  );

export const updateJobSchema = z
  .object({
    title: z
      .string()
      .min(5, "Job title must be at least 5 characters")
      .max(200, "Job title is too long")
      .optional(),
    description: z
      .string()
      .min(20, "Job description must be at least 20 characters")
      .max(5000, "Job description is too long")
      .optional(),
    location: z
      .string()
      .min(2, "Location is required")
      .max(200, "Location is too long")
      .optional(),
    employmentType: z
      .enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"] as const)
      .optional(),
    experienceMin: z.number().int().min(0).optional(),
    experienceMax: z.number().int().min(0).optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    skillIds: z.array(z.string().uuid("Invalid skill ID format")).optional(),
  })
  .refine(
    (data) =>
      data.experienceMax === undefined ||
      data.experienceMin === undefined ||
      data.experienceMin <= data.experienceMax,
    {
      message: "experienceMin must be less than or equal to experienceMax",
      path: ["experienceMin"],
    }
  )
  .refine(
    (data) =>
      data.salaryMax === undefined ||
      data.salaryMin === undefined ||
      data.salaryMin <= data.salaryMax,
    {
      message: "salaryMin must be less than or equal to salaryMax",
      path: ["salaryMin"],
    }
  );

export const jobSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  location: z.string().optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"] as const)
    .optional(),
  experienceMin: z.coerce.number().int().min(0).optional(),
  experienceMax: z.coerce.number().int().min(0).optional(),
  skills: z.string().optional(),
  sort: z
    .enum(["newest", "oldest", "salary_high", "salary_low"] as const)
    .default("newest"),
});

export type CreateJobRequest = z.infer<typeof createJobSchema>;
export type UpdateJobRequest = z.infer<typeof updateJobSchema>;
export type JobSearchParams = z.infer<typeof jobSearchSchema>;