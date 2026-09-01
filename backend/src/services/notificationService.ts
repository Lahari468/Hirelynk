import { NotificationType } from "@prisma/client";
import { NotFoundError } from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import type { NotificationListQuery } from "../validators/notificationValidator.js";

interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface PaginatedNotifications {
  items: NotificationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get user's notifications
 */
export const getUserNotifications = async (
  userId: string,
  query: NotificationListQuery
): Promise<PaginatedNotifications> => {
  const skip = (query.page - 1) * query.limit;

  const where: Record<string, unknown> = { userId };
  if (query.unread !== undefined) {
    where.isRead = !query.unread;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" as const },
      skip,
      take: query.limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items: notifications as NotificationResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Get unread notification count for user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

/**
 * Mark single notification as read
 */
export const markNotificationRead = async (
  notificationId: string,
  userId: string
): Promise<NotificationResponse> => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new NotFoundError("Notification not found");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
    },
  });

  return updated as NotificationResponse;
};

/**
 * Mark all notifications as read for user
 */
export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

/**
 * Delete single notification
 */
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new NotFoundError("Notification not found");
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });
};

/**
 * Create notification (internal - called by other services)
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string
): Promise<void> => {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  });
};