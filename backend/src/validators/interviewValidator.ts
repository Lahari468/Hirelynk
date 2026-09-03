import { z } from "zod";

export const createInterviewSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID format"),
  interviewType: z.enum(
    ["PHONE", "VIDEO", "TECHNICAL", "HR", "ONSITE"] as const
  ),
  scheduledAt: z.string().datetime("Invalid datetime format"),
  duration: z
    .number()
    .int()
    .positive("Duration must be a positive integer")
    .optional(),
  meetingLink: z
    .string()
    .url("Invalid URL format")
    .optional(),
});

export const updateInterviewSchema = z.object({
  interviewType: z
    .enum(["PHONE", "VIDEO", "TECHNICAL", "HR", "ONSITE"] as const)
    .optional(),
  scheduledAt: z
    .string()
    .datetime("Invalid datetime format")
    .optional(),
  duration: z
    .number()
    .int()
    .positive("Duration must be a positive integer")
    .optional(),
  meetingLink: z
    .string()
    .url("Invalid URL format")
    .optional(),
});

export const completeInterviewSchema = z.object({
  feedback: z
    .string()
    .min(10, "Feedback must be at least 10 characters")
    .max(3000, "Feedback must not exceed 3000 characters"),
});

export const interviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum(["SCHEDULED", "COMPLETED", "CANCELLED"] as const)
    .optional(),
  sort: z.enum(["newest", "oldest"] as const).default("newest"),
});

export type CreateInterviewRequest = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewRequest = z.infer<typeof updateInterviewSchema>;
export type CompleteInterviewRequest = z.infer<typeof completeInterviewSchema>;
export type InterviewListQuery = z.infer<typeof interviewListQuerySchema>;