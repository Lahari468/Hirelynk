import { AsyncController } from "../types/index.js";
import {
  sendMessageSchema,
  conversationIdParamSchema,
  messageListQuerySchema,
  conversationListQuerySchema,
} from "../validators/messageValidator.js";
import * as messageService from "../services/messageService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/messages
 * Send a message tied to a legitimate recruitment relationship
 * (candidate <-> recruiter, scoped to an application).
 */
export const sendMessage: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = sendMessageSchema.parse(req.body);
  const message = await messageService.sendMessage(
    req.user.id,
    req.user.role,
    data
  );

  created(res, "Message sent successfully", message);
};

/**
 * GET /api/messages/conversations
 * List the authenticated user's conversations (role-based)
 */
export const listConversations: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = conversationListQuerySchema.parse(req.query);
  const result = await messageService.listConversations(
    req.user.id,
    req.user.role,
    query
  );

  ok(res, "Conversations retrieved", result);
};

/**
 * GET /api/messages/conversations/:conversationId
 * List paginated messages inside a conversation the user participates in
 */
export const listConversationMessages: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { conversationId } = conversationIdParamSchema.parse(req.params);
  const query = messageListQuerySchema.parse(req.query);

  const result = await messageService.listConversationMessages(
    conversationId,
    req.user.id,
    req.user.role,
    query
  );

  ok(res, "Messages retrieved", result);
};

/**
 * PATCH /api/messages/conversations/:conversationId/read
 * Mark the other participant's messages in a conversation as read
 */
export const markConversationRead: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { conversationId } = conversationIdParamSchema.parse(req.params);
  const result = await messageService.markConversationRead(
    conversationId,
    req.user.id,
    req.user.role
  );

  ok(res, "Conversation marked as read", result);
};