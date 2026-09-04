import { z } from "zod";

export const createOfferSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID format"),
  salary: z
    .union([
      z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid salary format"),
      z.number().positive("Salary must be positive"),
    ])
    .optional(),
  startDate: z
    .string()
    .datetime("Invalid datetime format")
    .optional(),
  expiryDate: z
    .string()
    .datetime("Invalid datetime format")
    .optional(),
  notes: z
    .string()
    .max(2000, "Notes must not exceed 2000 characters")
    .optional(),
});

export const updateOfferSchema = z.object({
  salary: z
    .union([
      z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid salary format"),
      z.number().positive("Salary must be positive"),
    ])
    .optional(),
  startDate: z
    .string()
    .datetime("Invalid datetime format")
    .optional(),
  expiryDate: z
    .string()
    .datetime("Invalid datetime format")
    .optional(),
  notes: z
    .string()
    .max(2000, "Notes must not exceed 2000 characters")
    .optional(),
});

export const offerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"] as const)
    .optional(),
  sort: z.enum(["newest", "oldest"] as const).default("newest"),
});

export type CreateOfferRequest = z.infer<typeof createOfferSchema>;
export type UpdateOfferRequest = z.infer<typeof updateOfferSchema>;
export type OfferListQuery = z.infer<typeof offerListQuerySchema>;