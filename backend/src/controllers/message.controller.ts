import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { Message, Chat } from '@/models/mongodb.models';
import { successResponse, paginatedResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { validatePagination } from '@/utils/validation';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';
import { User } from '@prisma/client';

// Typed query for pagination
interface PaginationQuery {
  page?: string;
  limit?: string;
}

// Typed request body for sending a message
interface SendMessageBody {
  chatId: string;
  type: string;
  content: string;
  chatType?: string;
  imageUrl?: string;
  replyTo?: string;
}

// Send Message
export const sendMessage = async (
  req: Request<{}, {}, SendMessageBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { chatId, type, content, chatType, imageUrl, replyTo } = req.body;

    if (!content || content.length > config.chat.maxMessageLength) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.MESSAGE_TOO_LONG);
    }

    // Create message in MongoDB
    const message = await Message.create({
      chatId,
      chatType: chatType || 'one-on-one',
      senderId: req.userId,
      type,
      content,
      imageUrl,
      replyTo,
    });

    // Update last message in chat
    await Chat.findOneAndUpdate(
      { chatId },
      {
        $set: {
          lastMessagePreview: content.substring(0, 100),
          lastMessageAt: new Date(),
        },
      }
    );

    // Update PostgreSQL saved chats (for one-on-one)
    await prisma.savedChat.updateMany({
      where: { mongoChatId: chatId },
      data: {
        lastMessagePreview: content.substring(0, 100),
        lastMessageAt: new Date(),
      },
    });

    // Cache last 30 messages for groups
    if (chatType === 'group') {
      const { GroupChat } = await import('@/models/mongodb.models');
      
      // Get last 30 messages
      const recentMessages = await Message.find({ chatId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(30)
        .select('_id');

      const messageIds = recentMessages.map((m) => m._id);

      // Update GroupChat with cached message IDs and last message info
      await GroupChat.findOneAndUpdate(
        { groupId: chatId },
        {
          $set: {
            lastMessageId: message._id,
            lastMessageAt: new Date(),
            lastMessagePreview: content.substring(0, 100),
          },
        }
      );
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, avatar: true },
    });

    logger.info(`Message sent in chat ${chatId} by user ${req.userId}`);

    successResponse(res, {
      id: message._id.toString(),
      chatId: message.chatId,
      sender,
      type: message.type,
      content: message.content,
      imageUrl: message.imageUrl,
      replyTo: message.replyTo,
      createdAt: message.createdAt,
    }, SUCCESS_MESSAGES.MESSAGE_SENT);
  } catch (error) {
    next(error);
  }
};

// Get Messages
export const getMessages = async (
  req: Request<{ chatId: string }, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Validate chatId param
    const chatId = req.params.chatId;
    if (!chatId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Chat ID is required');
    }

    // Parse pagination params safely
    const pageParam = req.query.page ? Number(req.query.page) : undefined;
    const limitParam = req.query.limit ? Number(req.query.limit) : undefined;
    const { page, limit, skip } = validatePagination(pageParam, limitParam);

    const [messages, total] = await Promise.all([
      Message.find({ chatId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ chatId, isDeleted: false }),
    ]);

    // Fetch all senders from PostgreSQL
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, avatar: true },
    });

    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const messagesWithSenders = messages.map((msg) => ({
      id: msg._id.toString(),
      chatId: msg.chatId,
      sender: senderMap.get(msg.senderId) || { id: msg.senderId, name: 'Unknown', avatar: '' },
      type: msg.type,
      content: msg.content,
      imageUrl: msg.imageUrl,
      replyTo: msg.replyTo,
      readBy: msg.readBy,
      deliveredTo: msg.deliveredTo,
      createdAt: msg.createdAt,
    }));

    // Cache last 30 messages for groups (on first page load)
    if (page === 1) {
      const { GroupChat } = await import('@/models/mongodb.models');
      const groupChat = await GroupChat.findOne({ groupId: chatId });
      
      if (groupChat) {
        // This is a group chat, cache the last 30 messages
        const recentMessages = await Message.find({ chatId, isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(30)
          .select('_id');

        const messageIds = recentMessages.map((m) => m._id);

        await GroupChat.findOneAndUpdate(
          { groupId: chatId },
          {
            $set: {
              lastMessageId: messageIds[0] || null,
              lastMessageAt: messages[0]?.createdAt || new Date(),
              lastMessagePreview: messages[0]?.content?.substring(0, 100) || '',
            },
          }
        );
      }
    }

    paginatedResponse(res, messagesWithSenders, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Mark Message as Read
export const markAsRead = async (
  req: Request<{ messageId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const messageId = req.params.messageId;
    if (!messageId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Message ID is required');
    }

    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: req.userId },
    });

    successResponse(res, null);
  } catch (error) {
    next(error);
  }
};

//Delete Message
export const deleteMessage = async (
  req: Request<{ messageId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const messageId = req.params.messageId;
    if (!messageId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Message ID is required');
    }

    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    }

    if (message.senderId !== req.userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only delete your own messages');
    }

    await Message.findByIdAndUpdate(messageId, {
      $set: { isDeleted: true, deletedAt: new Date() },
    });

    logger.info(`Message deleted: ${messageId} by ${req.userId}`);

    successResponse(res, null, 'Message deleted successfully');
  } catch (error) {
    next(error);
  }
};
