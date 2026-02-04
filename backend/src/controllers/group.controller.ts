import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { GroupChat } from '@/models/mongodb.models';
import { successResponse, createdResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';
import { GroupMember } from '@prisma/client';

// Create group
export const createGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { name, description, memberIds } = req.body;

    // Validate member count
    if (memberIds.length > config.chat.maxGroupMembers - 1) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Cannot add more than ${config.chat.maxGroupMembers - 1} members`
      );
    }

    // Check if all members are from saved chats
    for (const memberId of memberIds) {
      const savedChat = await prisma.savedChat.findFirst({
        where: {
          OR: [
            { userId: req.userId, otherUserId: memberId },
            { userId: memberId, otherUserId: req.userId },
          ],
        },
      });

      if (!savedChat) {
        const user = await prisma.user.findUnique({
          where: { id: memberId },
          select: { name: true },
        });
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Cannot add ${user?.name || 'user'} - not in your saved chats`
        );
      }
    }

    const allMemberIds = [req.userId, ...memberIds];

    // Create PostgreSQL group first (without mongoGroupId)
    const group = await prisma.group.create({
      data: {
        name,
        description,
        creatorId: req.userId,
        mongoGroupId: '', // Temporary, will update after MongoDB creation
        members: {
          create: allMemberIds.map((memberId) => ({
            userId: memberId,
            role: memberId === req.userId ? 'admin' : 'member',
          })),
        },
      },
      include: {
        members: {
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
        },
      },
    });

    // Create MongoDB group chat with actual postgresGroupId
    const mongoGroup = await GroupChat.create({
      postgresGroupId: group.id,
      name,
      avatar: '',
      memberIds: allMemberIds,
    });

    // Update PostgreSQL with MongoDB groupId
    await prisma.group.update({
      where: { id: group.id },
      data: { mongoGroupId: mongoGroup.groupId },
    });

    logger.info(`Group created: ${group.id} by ${req.userId}`);

    createdResponse(res, group, SUCCESS_MESSAGES.GROUP_CREATED);
  } catch (error) {
    next(error);
  }
};

// Get user's groups
export const getUserGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: req.userId },
        },
      },
      include: {
        members: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enhance with MongoDB data (last message, unread count)
    const { Message } = await import('@/models/mongodb.models');
    
    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        // Get last message from MongoDB
        const lastMessage = await Message.findOne({
          chatId: group.mongoGroupId,
          isDeleted: false,
        })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean();

        // Calculate unread count
        const unreadCount = await Message.countDocuments({
          chatId: group.mongoGroupId,
          senderId: { $ne: req.userId },
          readBy: { $ne: req.userId },
          isDeleted: false,
        });

        return {
          ...group,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
              }
            : undefined,
          unreadCount,
        };
      })
    );

    successResponse(res, enhancedGroups);
  } catch (error) {
    next(error);
  }
};

// Get group details
export const getGroupDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params as { id: string };

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
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
        },
      },
    });

    if (!group) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    // Check if user is member
    const isMember = group.members.some((m: GroupMember) => m.userId === req.userId);
    if (!isMember) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.USER_NOT_IN_GROUP);
    }

    successResponse(res, group);
  } catch (error) {
    next(error);
  }
};

// Update group
export const updateGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params as { id: string };
    const { name, description, avatar } = req.body;

    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    if (group.creatorId !== req.userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.NOT_GROUP_CREATOR);
    }

    const updated = await prisma.group.update({
      where: { id },
      data: { name, description, avatar },
      include: {
        members: {
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
        },
      },
    });

    // Update MongoDB
    await GroupChat.findOneAndUpdate(
      { postgresGroupId: id },
      { $set: { name, avatar } }
    );

    logger.info(`Group updated: ${id}`);

    successResponse(res, updated, SUCCESS_MESSAGES.GROUP_UPDATED);
  } catch (error) {
    next(error);
  }
};

// Delete group
export const deleteGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params as { id: string };

    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    if (group.creatorId !== req.userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.NOT_GROUP_CREATOR);
    }

    // Delete from PostgreSQL (this will cascade delete group members)
    await prisma.group.delete({ where: { id } });
    
    // Delete from MongoDB
    const { Message } = await import('@/models/mongodb.models');
    await GroupChat.deleteOne({ postgresGroupId: id });
    
    // Delete all messages in the group
    await Message.deleteMany({ chatId: group.mongoGroupId });

    logger.info(`Group deleted: ${id}`);

    successResponse(res, null, SUCCESS_MESSAGES.GROUP_DELETED);
  } catch (error) {
    next(error);
  }
};

// Add member
export const addMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params as { id: string };
    const { userId } = req.body;

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    if (group.creatorId !== req.userId) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.NOT_GROUP_CREATOR);
    }

    if (group.members.length >= config.chat.maxGroupMembers) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.GROUP_FULL);
    }

    if (group.members.some((m: GroupMember) => m.userId === userId)) {
      throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.USER_ALREADY_IN_GROUP);
    }

    // Check saved chat
    const savedChat = await prisma.savedChat.findFirst({
      where: {
        OR: [
          { userId: req.userId, otherUserId: userId },
          { userId, otherUserId: req.userId },
        ],
      },
    });

    if (!savedChat) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CANNOT_ADD_UNSAVED_USER);
    }

    await prisma.groupMember.create({
      data: { groupId: id, userId, role: 'member' },
    });

    await GroupChat.findOneAndUpdate(
      { postgresGroupId: id },
      { $addToSet: { memberIds: userId } }
    );

    logger.info(`Member added to group: ${userId} -> ${id}`);

    successResponse(res, null, SUCCESS_MESSAGES.MEMBER_ADDED);
  } catch (error) {
    next(error);
  }
};

// Remove member
export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params as { id: string };
    const { userId } = req.body;

    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    // Allow if user is removing themselves (leaving) OR if user is the creator
    const isLeavingSelf = userId === req.userId;
    const isCreator = group.creatorId === req.userId;

    if (!isLeavingSelf && !isCreator) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.NOT_GROUP_CREATOR);
    }

    if (userId === group.creatorId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot remove group creator');
    }

    await prisma.groupMember.deleteMany({
      where: { groupId: id, userId },
    });

    await GroupChat.findOneAndUpdate(
      { postgresGroupId: id },
      { $pull: { memberIds: userId } }
    );

    logger.info(`Member removed from group: ${userId} <- ${id}`);

    successResponse(res, null, isLeavingSelf ? 'Left group successfully' : SUCCESS_MESSAGES.MEMBER_REMOVED);
  } catch (error) {
    next(error);
  }
};