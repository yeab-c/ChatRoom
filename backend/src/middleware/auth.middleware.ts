import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '@/config/database';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/config/constants';
import { logger } from '@/utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        clerkId: string;
        email: string;
        name: string;
        isBanned: boolean;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get auth from Clerk
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    const clerkUserId = auth.userId;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        isBanned: true,
      },
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.USER_NOT_FOUND
      );
    }

    // Check if user is banned
    if (user.isBanned) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_MESSAGES.USER_BANNED
      );
    }

    // Attach user to request
    req.userId = user.id;
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

// Protected route wrapper (alias)
export const protectedRoute = authenticate;

// Optional authentication (doesn't fail if no auth)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = getAuth(req);

    if (auth && auth.userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: auth.userId },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          isBanned: true,
        },
      });

      if (user && !user.isBanned) {
        req.userId = user.id;
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error);
    next();
  }
};