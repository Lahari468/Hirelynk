import { NotFoundError, AuthorizationError } from "../types/index.js";
import { prisma } from "../utils/prismaClient.js";
import { createNotification } from "./notificationService.js";
import type {
  SendMessageRequest,
  MessageListQuery,
  ConversationListQuery,
} from "../validators/messageValidator.js";

interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

interface PaginatedMessages {
  items: MessageResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ConversationParticipant {
  id: string;
  name: string;
}

interface ConversationSummary {
  id: string;
  applicationId: string;
  jobTitle: string | null;
  otherParticipant: ConversationParticipant | null;
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedConversations {
  items: ConversationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Shared include used whenever we need to authorize a conversation/application
// against the requesting user's recruitment relationship.
const applicationAuthInclude = {
  job: {
    select: {
      id: true,
      title: true,
      recruiterId: true,
    },
  },
  candidate: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

type ApplicationForAuth = {
  id: string;
  job: { id: string; title: string; recruiterId: string } | null;
  candidate: { user: { id: string; name: string } };
};

/**
 * Verify that the given user is a legitimate participant (candidate or
 * recruiter) of the recruitment relationship behind an application, and
 * return the other party's identity for notification/response purposes.
 */
const assertParticipant = (
  application: ApplicationForAuth,
  userId: string,
  userRole: string
): { recruiterId: string | null; candidateUserId: string } => {
  const candidateUserId = application.candidate.user.id;
  const recruiterId = application.job ? application.job.recruiterId : null;

  if (userRole === "CANDIDATE") {
    if (candidateUserId !== userId) {
      throw new AuthorizationError(
        "You do not have permission to access this conversation"
      );
    }
  } else if (userRole === "RECRUITER") {
    if (!recruiterId || recruiterId !== userId) {
      throw new AuthorizationError(
        "You do not have permission to access this conversation"
      );
    }
  } else {
    throw new AuthorizationError(
      "Only candidates and recruiters can use messaging"
    );
  }

  return { recruiterId, candidateUserId };
};

/**
 * Send a message within the recruitment relationship tied to an
 * application. Finds the existing conversation for that application, or
 * creates one if this is the first message.
 */
export const sendMessage = async (
  userId: string,
  userRole: string,
  data: SendMessageRequest
): Promise<MessageResponse> => {
  const application = await prisma.application.findUnique({
    where: { id: data.applicationId },
    include: applicationAuthInclude,
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  const { recruiterId, candidateUserId } = assertParticipant(
    application,
    userId,
    userRole
  );

  // Find or create the conversation for this application. The unique
  // constraint on applicationId guarantees at most one conversation per
  // recruitment relationship.
  let conversation = await prisma.conversation.findUnique({
    where: { applicationId: application.id },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { applicationId: application.id },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: userId,
      content: data.content,
    },
  });

  // Touch the conversation so it sorts to the top of the user's list.
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  // Notify the other participant.
  const recipientId = userRole === "CANDIDATE" ? recruiterId : candidateUserId;
  if (recipientId) {
    const preview =
      data.content.length > 100
        ? `${data.content.slice(0, 100)}...`
        : data.content;
    await createNotification(
      recipientId,
      "MESSAGE_RECEIVED",
      "New Message",
      preview
    );
  }

  return message as MessageResponse;
};

/**
 * List the authenticated user's conversations (role-based).
 */
export const listConversations = async (
  userId: string,
  userRole: string,
  query: ConversationListQuery
): Promise<PaginatedConversations> => {
  const skip = (query.page - 1) * query.limit;

  let where: Record<string, unknown>;

  if (userRole === "CANDIDATE") {
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!candidateProfile) {
      throw new NotFoundError("Candidate profile not found");
    }

    where = { application: { candidateId: candidateProfile.id } };
  } else if (userRole === "RECRUITER") {
    where = { application: { job: { recruiterId: userId } } };
  } else {
    throw new AuthorizationError(
      "Only candidates and recruiters can use messaging"
    );
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        application: {
          include: applicationAuthInclude,
        },
        messages: {
          orderBy: { createdAt: "desc" as const },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" as const },
      skip,
      take: query.limit,
    }),
    prisma.conversation.count({ where }),
  ]);

  const items: ConversationSummary[] = conversations.map((conversation) => {
    const otherParticipant: ConversationParticipant | null =
      userRole === "CANDIDATE"
        ? conversation.application.job
          ? {
              id: conversation.application.job.recruiterId,
              name: conversation.application.job.title,
            }
          : null
        : {
            id: conversation.application.candidate.user.id,
            name: conversation.application.candidate.user.name,
          };

    const lastMessage = conversation.messages[0]
      ? {
          content: conversation.messages[0].content,
          senderId: conversation.messages[0].senderId,
          createdAt: conversation.messages[0].createdAt,
        }
      : null;

    return {
      id: conversation.id,
      applicationId: conversation.applicationId,
      jobTitle: conversation.application.job?.title ?? null,
      otherParticipant,
      lastMessage,
      unreadCount: conversation._count.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  });

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Fetch a conversation for authorization purposes.
 */
const getConversationForAuth = async (conversationId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      application: {
        include: applicationAuthInclude,
      },
    },
  });

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  return conversation;
};

/**
 * List messages inside a conversation the user participates in.
 */
export const listConversationMessages = async (
  conversationId: string,
  userId: string,
  userRole: string,
  query: MessageListQuery
): Promise<PaginatedMessages> => {
  const conversation = await getConversationForAuth(conversationId);
  assertParticipant(conversation.application, userId, userRole);

  const skip = (query.page - 1) * query.limit;
  const orderBy =
    query.sort === "newest"
      ? { createdAt: "desc" as const }
      : { createdAt: "asc" as const };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy,
      skip,
      take: query.limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    items: messages as MessageResponse[],
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

/**
 * Mark all of the other participant's messages in a conversation as read.
 */
export const markConversationRead = async (
  conversationId: string,
  userId: string,
  userRole: string
): Promise<{ conversationId: string; markedCount: number }> => {
  const conversation = await getConversationForAuth(conversationId);
  assertParticipant(conversation.application, userId, userRole);

  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { conversationId, markedCount: result.count };
};