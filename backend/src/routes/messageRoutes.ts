import { Router } from "express";
import * as messageController from "../controllers/messageController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// POST /api/messages - send a message within an authorized conversation
router.post(
  "/",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  asyncHandler(messageController.sendMessage)
);

// GET /api/messages/conversations - list the user's conversations
router.get(
  "/conversations",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  asyncHandler(messageController.listConversations)
);

// GET /api/messages/conversations/:conversationId - list messages in a conversation
router.get(
  "/conversations/:conversationId",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  asyncHandler(messageController.listConversationMessages)
);

// PATCH /api/messages/conversations/:conversationId/read - mark messages as read
router.patch(
  "/conversations/:conversationId/read",
  authenticate,
  authorize("CANDIDATE", "RECRUITER"),
  asyncHandler(messageController.markConversationRead)
);

export default router;