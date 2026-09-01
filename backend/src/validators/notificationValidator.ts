import { z } from "zod";

export const notificationListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  unread: z.coerce.boolean().optional(),
});

export const notificationIdSchema = z.object({
  id: z.string().uuid("Invalid notification ID format"),
});

export type NotificationListQuery = z.infer<typeof notificationListSchema>;