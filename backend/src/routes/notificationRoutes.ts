import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Notification routes - all require authentication
 */

// GET /api/notifications
router.get(
  "/",
  authenticate,
  asyncHandler(notificationController.getUserNotifications)
);

// GET /api/notifications/unread-count
router.get(
  "/unread-count",
  authenticate,
  asyncHandler(notificationController.getUnreadCount)
);

// PATCH /api/notifications/:id/read
router.patch(
  "/:id/read",
  authenticate,
  asyncHandler(notificationController.markNotificationRead)
);

// PATCH /api/notifications/read-all
router.patch(
  "/read-all",
  authenticate,
  asyncHandler(notificationController.markAllNotificationsRead)
);

// DELETE /api/notifications/:id
router.delete(
  "/:id",
  authenticate,
  asyncHandler(notificationController.deleteNotification)
);

export default router;