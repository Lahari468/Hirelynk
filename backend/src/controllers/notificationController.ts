import { AsyncController } from "../types/index.js";
import {
  notificationListSchema,
  notificationIdSchema,
} from "../validators/notificationValidator.js";
import * as notificationService from "../services/notificationService.js";
import { ok } from "../utils/response.js";

/**
 * GET /api/notifications
 * Get user's notifications
 */
export const getUserNotifications: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = notificationListSchema.parse(req.query);
  const result = await notificationService.getUserNotifications(req.user.id, query);

  ok(res, "Notifications retrieved", result);
};

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
export const getUnreadCount: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const count = await notificationService.getUnreadCount(req.user.id);

  ok(res, "Unread count retrieved", { unreadCount: count });
};

/**
 * PATCH /api/notifications/:id/read
 * Mark single notification as read
 */
export const markNotificationRead: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = notificationIdSchema.parse({ id: req.params.id });
  const notification = await notificationService.markNotificationRead(id, req.user.id);

  ok(res, "Notification marked as read", notification);
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for user
 */
export const markAllNotificationsRead: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  await notificationService.markAllNotificationsRead(req.user.id);

  ok(res, "All notifications marked as read");
};

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
export const deleteNotification: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = notificationIdSchema.parse({ id: req.params.id });
  await notificationService.deleteNotification(id, req.user.id);

  ok(res, "Notification deleted successfully");
};