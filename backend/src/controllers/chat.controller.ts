import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { Chat, Message } from '@/models/mongodb.models';
import { successResponse, paginatedResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { validatePagination } from '@/utils/validation';
import { logger } from '@/utils/logger';
import { SavedChat } from '@prisma/client';

// Typed query params for pagination
interface PaginationQuery {
  page?: string;
  limit?: string;
}

// Get user's saved chats
export const getSavedChats = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Safely access page/limit using bracket notation
    const pageParam = req.query['page'] ? Number(req.query['page']) : undefined;
    const limitParam = req.query['limit'] ? Number(req.query['limit']) : undefined;

    const { page, limit, skip } = validatePagination(pageParam, limitParam);

    const [chats, total] = await Promise.all([
      prisma.savedChat.findMany({
        where: { userId: req.userId },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isOnline: true,
            },
          },
        },
      }),
      prisma.savedChat.count({ where: { userId: req.userId } }),
    ]);

    // Map chats to include other user details and calculate real unread count
    const chatList = await Promise.all(
      chats.map(async (chat: SavedChat) => {
        const otherUser = await prisma.user.findUnique({
          where: { id: chat.otherUserId },
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true,
          },
        });

        // Calculate actual unread count from MongoDB
        // Count messages where senderId !== currentUserId AND currentUserId is NOT in readBy array
        const unreadCount = await Message.countDocuments({
          chatId: chat.mongoChatId,
          senderId: { $ne: req.userId }, // Not sent by current user
          readBy: { $ne: req.userId }, // Current user has not read it
          isDeleted: false,
        });

        return {
          id: chat.id,
          chatId: chat.mongoChatId,
          otherUser,
          lastMessage: chat.lastMessagePreview
            ? {
              content: chat.lastMessagePreview,
              createdAt: chat.lastMessageAt,
            }
            : undefined,
          unreadCount,
          updatedAt: chat.updatedAt,
        };
      })
    );

    paginatedResponse(res, chatList, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Save chat
export const saveChat = async (
  req: Request<{ chatId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Narrow chatId safely
    const chatId = req.params.chatId;
    if (!chatId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Chat ID is required');
    }

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.userId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not a participant in this chat');
    }

    // Check if already saved by this user
    if (chat.savedBy.includes(req.userId)) {
      throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.CHAT_ALREADY_SAVED);
    }

    // Add user to savedBy
    chat.savedBy.push(req.userId);

    // Check if both saved
    const bothSaved = chat.participants.every((p) => chat.savedBy.includes(p));

    if (bothSaved) {
      chat.type = 'permanent';
      chat.isTemporary = false;
      chat.isSaved = true;
      chat.expiresAt = undefined;

      await chat.save();

      // Create saved chat records for both users
      await Promise.all(
        chat.participants.map((participantId) => {
          const otherUserId = chat.participants.find((p) => p !== participantId);
          return prisma.savedChat.upsert({
            where: {
              userId_otherUserId: {
                userId: participantId,
                otherUserId: otherUserId!,
              },
            },
            create: {
              userId: participantId,
              otherUserId: otherUserId!,
              mongoChatId: chat.chatId,
              lastMessageAt: chat.lastMessageAt,
              lastMessagePreview: chat.lastMessagePreview,
            },
            update: {
              mongoChatId: chat.chatId,
              lastMessageAt: chat.lastMessageAt,
              lastMessagePreview: chat.lastMessagePreview,
            },
          });
        })
      );

      logger.info(`Chat ${chatId} saved by both users - now permanent`);

      // Emit socket event to both users that chat is now permanent
      const io = (req as any).app.get('io');
      if (io) {
        io.to(`chat:${chatId}`).emit('chat-saved', {
          chatId: chat.chatId,
          savedBy: chat.savedBy,
          isSaved: true,
        });
      }

      successResponse(res, {
        chatId: chat.chatId,
        isSaved: true,
        savedBy: chat.savedBy,
      }, SUCCESS_MESSAGES.CHAT_SAVED);
      return;
    }

    await chat.save();

    logger.info(`Chat ${chatId} saved by ${req.userId} - waiting for other user`);

    // Emit socket event to other user that this user saved
    const io = (req as any).app.get('io');
    if (io) {
      const otherUserId = chat.participants.find(p => p !== req.userId);
      if (otherUserId) {
        io.to(otherUserId).emit('chat-saved', {
          chatId: chat.chatId,
          savedBy: chat.savedBy,
          isSaved: false,
        });
      }
    }

    successResponse(res, {
      chatId: chat.chatId,
      isSaved: false,
      savedBy: chat.savedBy,
      message: 'Chat saved. Waiting for other user to save.',
    }, SUCCESS_MESSAGES.CHAT_SAVED);
  } catch (error) {
    next(error);
  }
};

// Delete chat
export const deleteChat = async (
  req: Request<{ chatId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Narrow chatId safely
    const chatId = req.params.chatId;
    if (!chatId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Chat ID is required');
    }

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    // Check if user is participant
    if (!chat.participants.includes(req.userId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not a participant in this chat');
    }

    // Delete from MongoDB
    await Chat.deleteOne({ chatId });

    // Delete saved chat records
    await prisma.savedChat.deleteMany({
      where: {
        OR: chat.participants.map((participantId) => ({
          userId: participantId,
          mongoChatId: chatId, // chatId is now guaranteed string
        })),
      },
    });

    logger.info(`Chat deleted: ${chatId} by ${req.userId}`);

    successResponse(res, null, SUCCESS_MESSAGES.CHAT_DELETED);
  } catch (error) {
    next(error);
  }
};

// Create permanent chat between group members
export const createGroupMemberChat = async (
  req: Request<{}, {}, { otherUserId: string; groupId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { otherUserId, groupId } = req.body;

    if (!otherUserId || !groupId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'otherUserId and groupId are required');
    }

    // Verify both users are in the same group
    const groupMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: [req.userId, otherUserId] },
      },
    });

    if (groupMembers.length !== 2) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Both users must be members of the same group'
      );
    }

    // Check if either user has blocked the other
    const blockExists = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: req.userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: req.userId },
        ],
      },
    });

    if (blockExists) {
      const isBlockedByMe = blockExists.blockerId === req.userId;
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        isBlockedByMe 
          ? 'You cannot start a chat with a user you have blocked'
          : 'You cannot start a chat with this user because they have blocked you'
      );
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [req.userId, otherUserId] },
      type: 'permanent',
    });

    if (existingChat) {
      // Return existing chat
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { id: true, name: true, avatar: true, isOnline: true },
      });

      logger.info(`Returning existing chat: ${existingChat.chatId}`);

      successResponse(res, {
        chatId: existingChat.chatId,
        otherUser,
      }, 'Chat already exists');
      return;
    }

    // Create new permanent chat
    const chat = await Chat.create({
      participants: [req.userId, otherUserId],
      type: 'permanent',
      isTemporary: false,
      savedBy: [req.userId, otherUserId],
      isSaved: true,
      createdBy: req.userId,
    });

    // Create saved chat records for both users
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, avatar: true, isOnline: true },
    });

    await Promise.all([
      prisma.savedChat.upsert({
        where: {
          userId_otherUserId: {
            userId: req.userId,
            otherUserId,
          },
        },
        create: {
          userId: req.userId,
          otherUserId,
          mongoChatId: chat.chatId,
        },
        update: {
          mongoChatId: chat.chatId,
        },
      }),
      prisma.savedChat.upsert({
        where: {
          userId_otherUserId: {
            userId: otherUserId,
            otherUserId: req.userId,
          },
        },
        create: {
          userId: otherUserId,
          otherUserId: req.userId,
          mongoChatId: chat.chatId,
        },
        update: {
          mongoChatId: chat.chatId,
        },
      }),
    ]);

    logger.info(`Created group member chat: ${chat.chatId} between ${req.userId} and ${otherUserId}`);

    successResponse(res, {
      chatId: chat.chatId,
      otherUser,
    }, SUCCESS_MESSAGES.CHAT_CREATED);
  } catch (error) {
    next(error);
  }
};

// Get chat details (including expiresAt for temporary chats)
export const getChatDetails = async (
  req: Request<{ chatId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const chatId = req.params.chatId;
    if (!chatId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Chat ID is required');
    }

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.userId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not a participant in this chat');
    }

    // Get other user details
    const otherUserId = chat.participants.find(p => p !== req.userId);
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        name: true,
        avatar: true,
        isOnline: true,
      },
    });

    successResponse(res, {
      chatId: chat.chatId,
      type: chat.type,
      isTemporary: chat.isTemporary,
      expiresAt: chat.expiresAt,
      savedBy: chat.savedBy,
      isSaved: chat.isSaved,
      participants: chat.participants,
      otherUser,
      createdAt: chat.createdAt,
      serverTime: new Date(), // Include server time for accurate sync
    }, 'Chat details retrieved');
  } catch (error) {
    next(error);
  }
};

// Terminate temporary chat (when user leaves without saving)
export const terminateChat = async (
  req: Request<{ chatId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const chatId = req.params.chatId;
    if (!chatId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Chat ID is required');
    }

    const chat = await Chat.findOne({ chatId });

    if (!chat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.userId)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not a participant in this chat');
    }

    // Only allow terminating temporary chats
    if (!chat.isTemporary) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot terminate permanent chats');
    }

    // Check if user has already saved - if so, don't terminate
    if (chat.savedBy.includes(req.userId)) {
      // User already saved, just return success without terminating
      logger.info(`User ${req.userId} tried to terminate chat ${chatId} but already saved it`);
      successResponse(res, null, 'Chat not terminated - you have already saved it');
      return;
    }

    // Check if the OTHER user has saved
    const otherUserId = chat.participants.find(p => p !== req.userId);
    const otherUserSaved = otherUserId && chat.savedBy.includes(otherUserId);

    // Delete the chat
    await Chat.deleteOne({ chatId });

    logger.info(`Temporary chat ${chatId} terminated by ${req.userId} (other user saved: ${otherUserSaved})`);

    // Emit socket events
    const io = (req as any).app.get('io');
    if (io && otherUserId) {
      if (otherUserSaved) {
        // Other user saved but this user didn't - notify other user
        io.to(otherUserId).emit('chat-terminated', {
          chatId,
          reason: 'other-left-without-saving',
          message: 'The other person left without saving the chat.',
        });

        // Send different message to the user who's leaving
        io.to(req.userId).emit('chat-terminated', {
          chatId,
          reason: 'you-left-other-saved',
          message: 'You left the chat even though the other person saved it.',
        });
      } else {
        // Neither saved - standard termination
        io.to(`chat:${chatId}`).emit('chat-terminated', {
          chatId,
          reason: 'user-left-without-saving',
          message: 'The other person left without saving the chat.',
        });
      }
    }

    successResponse(res, null, 'Chat terminated');
  } catch (error) {
    next(error);
  }
};
