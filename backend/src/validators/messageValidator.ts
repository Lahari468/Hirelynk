import { z } from "zod";

export const sendMessageSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID format"),
  content: z
    .string()
    .trim()
    .min(1, "Message content cannot be empty")
    .max(2000, "Message must not exceed 2000 characters")
    .refine((val) => val.length > 0, {
      message: "Message content cannot be empty",
    }),
});

export const conversationIdParamSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID format"),
});

export const messageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["newest", "oldest"] as const).default("oldest"),
});

export const conversationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;
export type MessageListQuery = z.infer<typeof messageListQuerySchema>;
export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;