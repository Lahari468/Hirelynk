import { z } from "zod";

export const createFeedbackSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID format"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must not exceed 5"),
  comment: z
    .string()
    .trim()
    .min(3, "Comment must be at least 3 characters")
    .max(2000, "Comment must not exceed 2000 characters")
    .refine((val) => val.length > 0, {
      message: "Comment cannot be empty",
    }),
});

export const updateFeedbackSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must not exceed 5")
    .optional(),
  comment: z
    .string()
    .trim()
    .min(3, "Comment must be at least 3 characters")
    .max(2000, "Comment must not exceed 2000 characters")
    .refine((val) => val.length > 0, {
      message: "Comment cannot be empty",
    })
    .optional(),
});

export const feedbackIdParamSchema = z.object({
  id: z.string().uuid("Invalid feedback ID format"),
});

export const feedbackListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  applicationId: z.string().uuid("Invalid application ID format").optional(),
  sort: z.enum(["newest", "oldest"] as const).default("newest"),
});

export type CreateFeedbackRequest = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackRequest = z.infer<typeof updateFeedbackSchema>;
export type FeedbackIdParam = z.infer<typeof feedbackIdParamSchema>;
export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;