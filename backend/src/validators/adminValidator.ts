import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const adminUserListSchema = paginationSchema.extend({
  search: z.string().optional(),
  role: z
    .enum(["CANDIDATE", "RECRUITER", "ADMIN"] as const)
    .optional(),
  sort: z.enum(["newest", "oldest", "name"] as const).default("newest"),
});

export const adminJobListSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"] as const).optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"] as const)
    .optional(),
  sort: z.enum(["newest", "oldest", "salary_high", "salary_low"] as const).default("newest"),
});

export const adminAuditLogListSchema = paginationSchema.extend({
  action: z.string().optional(),
  entityType: z.string().optional(),
  sort: z.enum(["newest", "oldest"] as const).default("newest"),
});

export const uuidSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export type AdminUserListQuery = z.infer<typeof adminUserListSchema>;
export type AdminJobListQuery = z.infer<typeof adminJobListSchema>;
export type AdminAuditLogListQuery = z.infer<typeof adminAuditLogListSchema>;