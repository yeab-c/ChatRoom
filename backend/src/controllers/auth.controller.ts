import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { clerkClient } from '@clerk/express';
import { prisma } from '@/config/database';
import { successResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { isAllowedEmail } from '@/config/clerk';
import { logger } from '@/utils/logger';

// Register/Sync user from Clerk
export const syncUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(auth.userId);

    if (!clerkUser) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Get primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No email address found');
    }

    // Check email domain
    if (!isAllowedEmail(primaryEmail.emailAddress)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.INVALID_EMAIL_DOMAIN);
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    // Create or update user
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: auth.userId,
          email: primaryEmail.emailAddress.toLowerCase(),
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
          avatar: clerkUser.imageUrl || '',
        },
      });

      logger.info(`New user created: ${user.email}`);
    } else {
      // Update user info from Clerk
      user = await prisma.user.update({
        where: { clerkId: auth.userId },
        data: {
          email: primaryEmail.emailAddress.toLowerCase(),
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || user.name,
          avatar: clerkUser.imageUrl || user.avatar,
        },
      });
    }

    successResponse(res, user, SUCCESS_MESSAGES.LOGIN_SUCCESS);
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
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

    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.userId) {
      // Update user status to offline
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          isOnline: false,
          lastSeen: new Date(),
        },
      });

      logger.info(`User logged out: ${req.userId}`);
    }

    successResponse(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  } catch (error) {
    next(error);
  }
};
