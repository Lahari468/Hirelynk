import { z } from "zod";

export const recruiterDashboardQuerySchema = z.object({
  recentLimit: z.coerce.number().int().min(1).max(20).default(5),
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
  search: z.string().optional().transform((val) => (val ? val.trim() : undefined)),
  sort: z.enum(["newest", "oldest"] as const).default("newest"),
});

export type RecruiterDashboardQuery = z.infer<
  typeof recruiterDashboardQuerySchema
>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;