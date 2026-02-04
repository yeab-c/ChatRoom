import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS } from '@/config/constants';
import { config } from '@/config/env';

// Check if user is admin
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId || !req.user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required'
      );
    }

    // Check if user email matches admin email
    const isAdminUser = req.user.email === config.admin.email;

    if (!isAdminUser) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Admin access required'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Admin-only route wrapper (alias)
export const adminOnly = isAdmin;
