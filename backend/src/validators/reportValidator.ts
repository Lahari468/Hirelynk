import { z } from "zod";

const targetTypeEnum = [
  "JOB",
  "USER",
  "APPLICATION",
  "MESSAGE",
  "FEEDBACK",
] as const;

const reasonEnum = [
  "SPAM",
  "FRAUD",
  "HARASSMENT",
  "INAPPROPRIATE_CONTENT",
  "FAKE_JOB",
  "MISLEADING_INFORMATION",
  "OTHER",
] as const;

const statusEnum = ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"] as const;

export const createReportSchema = z
  .object({
    targetType: z.enum(targetTypeEnum, {
      errorMap: () => ({ message: "Invalid report target type" }),
    }),
    targetId: z.string().uuid("Invalid target ID format"),
    reason: z.enum(reasonEnum, {
      errorMap: () => ({ message: "Invalid report reason" }),
    }),
    description: z
      .string()
      .trim()
      .min(1, "Description cannot be empty")
      .max(2000, "Description must not exceed 2000 characters")
      .optional(),
  })
  .refine(
    (data) => data.reason !== "OTHER" || !!data.description,
    {
      message: "A description is required when reason is OTHER",
      path: ["description"],
    }
  );

export const reportIdParamSchema = z.object({
  id: z.string().uuid("Invalid report ID format"),
});

export const reportListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(statusEnum).optional(),
  sort: z.enum(["newest", "oldest"] as const).default("newest"),
});

export const adminReportListQuerySchema = reportListQuerySchema.extend({
  targetType: z.enum(targetTypeEnum).optional(),
});

// Admins may move a report to REVIEWING, RESOLVED, or DISMISSED. Moving back
// to PENDING is intentionally not offered - reopening isn't a supported
// business rule for Phase 19.
export const adminUpdateReportSchema = z
  .object({
    status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"] as const),
    resolutionNote: z
      .string()
      .trim()
      .min(1, "Resolution note cannot be empty")
      .max(2000, "Resolution note must not exceed 2000 characters")
      .optional(),
  })
  .refine(
    (data) =>
      data.status === "REVIEWING" ? true : !!data.resolutionNote,
    {
      message:
        "A resolution note is required when resolving or dismissing a report",
      path: ["resolutionNote"],
    }
  );

export type CreateReportRequest = z.infer<typeof createReportSchema>;
export type ReportListQuery = z.infer<typeof reportListQuerySchema>;
export type AdminReportListQuery = z.infer<typeof adminReportListQuerySchema>;
export type AdminUpdateReportRequest = z.infer<typeof adminUpdateReportSchema>;