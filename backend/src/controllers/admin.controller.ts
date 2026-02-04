// src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { Chat, Message } from '@/models/mongodb.models';
import { successResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS } from '@/config/constants';
import { logger } from '@/utils/logger';

// Get admin statistics
export const getAdminStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalChats,
      totalGroups,
      totalMessages,
      pendingReports,
      bannedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isOnline: true } }),
      Chat.countDocuments(),
      prisma.group.count(),
      Message.countDocuments(),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.user.count({ where: { isBanned: true } }),
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      totalChats,
      totalGroups,
      totalMessages,
      pendingReports,
      bannedUsers,
    };

    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

// Get all reports
export const getReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;

    const reports = await prisma.report.findMany({
      where: status ? { status: status as string } : undefined,
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        reportedUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, reports);
  } catch (error) {
    next(error);
  }
};

// Review report
export const reviewReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }

    const { id } = req.params as { id: string };
    const { status, reviewNotes } = req.body;

    const report = await prisma.report.update({
      where: { id },
      data: {
        status,
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        reportedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info(`Report ${id} reviewed by ${req.userId}`);

    successResponse(res, report);
  } catch (error) {
    next(error);
  }
};

// Ban user
export const banUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'User ID is required');
    }

    // Handle array case
    if (Array.isArray(userId)) userId = userId[0];

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason,
        isOnline: false,
      },
    });

    logger.info(`User banned: ${userId}`);

    successResponse(res, user, 'User banned successfully');
  } catch (error) {
    next(error);
  }
};

// Unban user
export const unbanUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { userId } = req.params;

    if (!userId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'User ID is required');
    }

    if (Array.isArray(userId)) userId = userId[0];

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
        banReason: null,
      },
    });

    logger.info(`User unbanned: ${userId}`);

    successResponse(res, user, 'User unbanned successfully');
  } catch (error) {
    next(error);
  }
};