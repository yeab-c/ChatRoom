import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { MatchQueue, Chat } from '@/models/mongodb.models';
import { successResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { cacheUserProfile, getCachedUserProfile, invalidateUserProfileCache } from '@/utils/cache';
import { logger } from '@/utils/logger';

// Get user profile
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Try cache first
    const cached = await getCachedUserProfile(id as string);
    if (cached) {
      successResponse(res, cached);
        return;
    }

    const user = await prisma.user.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        gender: true,
        age: true,
        country: true,
        hobbies: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Cache profile
    await cacheUserProfile(id as string, user);

    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { name, bio, gender, age, country, hobbies } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(gender && { gender }),
        ...(age && { age }),
        ...(country && { country }),
        ...(hobbies !== undefined && { hobbies }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        gender: true,
        age: true,
        country: true,
        hobbies: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    // Invalidate cache
    await invalidateUserProfileCache(req.userId);

    logger.info(`User profile updated: ${req.userId}`);

    successResponse(res, user, SUCCESS_MESSAGES.PROFILE_UPDATED);
  } catch (error) {
    next(error);
  }
};

// Update user avatar
export const updateUserAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Avatar URL is required');
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    // Invalidate cache
    await invalidateUserProfileCache(req.userId);

    logger.info(`User avatar updated: ${req.userId}`);

    successResponse(res, user, SUCCESS_MESSAGES.PROFILE_UPDATED);
  } catch (error) {
    next(error);
  }
};

// Get user statistics
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const [savedChats, groups, blockedUsers] = await Promise.all([
      prisma.savedChat.count({ where: { userId: req.userId } }),
      prisma.groupMember.count({ where: { userId: req.userId } }),
      prisma.blockedUser.count({ where: { blockerId: req.userId } }),
    ]);

    const stats = {
      savedChats,
      groups,
      blockedUsers,
    };

    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

// Report user
export const reportUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { userId } = req.params;
    const { reason } = req.body;

    // Can't report yourself
    if (userId === req.userId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot report yourself');
    }

    // Check if user exists
    const reportedUser = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!reportedUser) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if already reported by this user
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: req.userId,
        reportedUserId: userId as string,
        status: 'pending',
      },
    });

    if (existingReport) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'You have already reported this user');
    }

    // Create report
    await prisma.report.create({
      data: {
        reporterId: req.userId,
        reportedUserId: userId as string,
        reason,
        status: 'pending',
      },
    });

    // Count total reports for this user (from different reporters)
    const reportCount = await prisma.report.count({
      where: {
        reportedUserId: userId as string,
        status: 'pending',
      },
    });

    // Auto-ban if 5 or more reports from different users
    if (reportCount >= 5) {
      const banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      await prisma.user.update({
        where: { id: userId as string },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          // @ts-ignore - bannedUntil exists in schema, TypeScript cache issue
          bannedUntil: banUntil,
          banReason: `Automatically banned due to ${reportCount} reports`,
        },
      });

      logger.warn(`User auto-banned due to reports: ${userId} (${reportCount} reports)`);
    }

    logger.info(`User reported: ${userId} by ${req.userId}`);

    successResponse(res, null, 'Report submitted successfully. Thank you for helping keep our community safe.');
  } catch (error) {
    next(error);
  }
};

// Block user
export const blockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { userId } = req.params;

    // Can't block yourself
    if (userId === req.userId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot block yourself');
    }

    // Check if user exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!userToBlock) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if already blocked
    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.userId,
          blockedId: userId as string,
        },
      },
    });

    if (existingBlock) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'User is already blocked');
    }

    // Create block
    await prisma.blockedUser.create({
      data: {
        blockerId: req.userId,
        blockedId: userId as string,
      },
    });

    // Remove saved chats (both directions) from PostgreSQL
    await prisma.savedChat.deleteMany({
      where: {
        OR: [
          { userId: req.userId, otherUserId: userId as string },
          { userId: userId as string, otherUserId: req.userId },
        ],
      },
    });

    // Delete the Chat document from MongoDB
    await Chat.deleteOne({
      participants: { $all: [req.userId, userId as string] },
      type: 'permanent',
    });

    logger.info(`User blocked: ${userId} by ${req.userId}`);

    successResponse(res, null, SUCCESS_MESSAGES.USER_BLOCKED);
  } catch (error) {
    next(error);
  }
};

// Unblock user
export const unblockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { userId } = req.params;

    const result = await prisma.blockedUser.deleteMany({
      where: {
        blockerId: req.userId,
        blockedId: userId as string,
      },
    });

    if (result.count === 0) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User is not blocked');
    }

    // Clean up stale MatchQueue entries
    // If the current user is searching, delete their entry so it gets recreated with fresh blockedUserIds
    await MatchQueue.deleteMany({
      userId: req.userId,
      status: 'searching',
    });

    logger.info(`User unblocked: ${userId} by ${req.userId}`);

    successResponse(res, null, SUCCESS_MESSAGES.USER_UNBLOCKED);
  } catch (error) {
    next(error);
  }
};

// Get blocked users
export const getBlockedUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: req.userId },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const users = blockedUsers.map((block) => ({
      id: block.blocked.id,
      name: block.blocked.name,
      avatar: block.blocked.avatar,
      blockedAt: block.createdAt,
    }));

    successResponse(res, users);
  } catch (error) {
    next(error);
  }
};
