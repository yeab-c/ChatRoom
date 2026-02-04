import { Socket } from 'socket.io';
import { verifyToken } from '@clerk/backend';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { config } from '@/config/env';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user?: any;
}


 // Scket.IO authentication middleware
 // Verifies Clerk token and attaches user to socket

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    // Access token from auth object using bracket notation
    const token = socket.handshake.auth['token'];

    if (!token) {
      logger.warn('Socket connection attempt without token');
      return next(new Error('No token provided'));
    }

    // Verify token with Clerk
    let userId: string;

    try {
      // Use Clerk's verifyToken function with secretKey
      const decoded = await verifyToken(token, {
        secretKey: config.clerk.secretKey,
      });
      userId = decoded.sub;
    } catch (verifyError) {
      logger.warn('Invalid token - verification failed:', verifyError);
      return next(new Error('Invalid token'));
    }

    if (!userId) {
      logger.warn('Invalid token - no userId in claims');
      return next(new Error('Invalid token'));
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      logger.warn(`User not found for clerkId: ${userId}`);
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    (socket as AuthenticatedSocket).userId = user.id;
    (socket as AuthenticatedSocket).user = user;

    logger.info(`Socket authenticated: ${user.email}`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};