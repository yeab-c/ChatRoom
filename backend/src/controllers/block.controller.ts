import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { successResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { invalidateBlockedUsersCache } from '@/utils/cache';
import { logger } from '@/utils/logger';

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

    const { userId } = req.body;

    if (req.userId === userId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot block yourself');
    }

    const existing = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.userId,
          blockedId: userId,
        },
      },
    });

    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'User already blocked');
    }

    await prisma.blockedUser.create({
      data: {
        blockerId: req.userId,
        blockedId: userId,
      },
    });

    await invalidateBlockedUsersCache(req.userId);

    logger.info(`User ${req.userId} blocked ${userId}`);

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
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Block record not found');
    }

    await invalidateBlockedUsersCache(req.userId);

    logger.info(`User ${req.userId} unblocked ${userId}`);

    successResponse(res, null, SUCCESS_MESSAGES.USER_UNBLOCKED);
  } catch (error) {
    next(error);
  }
};

type BlockedItem = {
  id: string;
  blocked: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
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

    const blocked = await prisma.blockedUser.findMany({
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

    const blockedList = blocked.map((b: BlockedItem) => ({
      id: b.id,
      blockedUser: b.blocked,
      createdAt: b.createdAt,
    }));

    successResponse(res, blockedList);
  } catch (error) {
    next(error);
  }
};
