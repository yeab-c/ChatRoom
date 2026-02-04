import { Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import { prisma } from '@/config/database';
import { MatchQueue, Chat } from '@/models/mongodb.models';
import { successResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';

// Get blocked user IDs
const getBlockedUserIds = async (userId: string): Promise<string[]> => {
  const blocked = await prisma.blockedUser.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });

  const blockedByMe = blocked.map(({ blockedId }: { blockedId: string }) => blockedId);

  const blockedMe = await prisma.blockedUser.findMany({
    where: { blockedId: userId },
    select: { blockerId: true },
  });

  const blockedByOthers = blockedMe.map(({ blockerId }: { blockerId: string }) => blockerId);

  return [...new Set([...blockedByMe, ...blockedByOthers])];
};

// Start match
export const startMatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Check if user is banned
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { 
        isBanned: true, 
        // @ts-ignore - bannedUntil exists in schema
        bannedUntil: true 
      },
    });

    if (currentUser?.isBanned) {
      // Check if ban has expired
      // @ts-ignore - bannedUntil exists in schema
      if (currentUser.bannedUntil && new Date() > currentUser.bannedUntil) {
        // Unban user
        await prisma.user.update({
          where: { id: req.userId },
          data: {
            isBanned: false,
            bannedAt: null,
            // @ts-ignore - bannedUntil exists in schema
            bannedUntil: null,
            banReason: null,
          },
        });
      } else {
        // @ts-ignore - bannedUntil exists in schema
        const banMessage = currentUser.bannedUntil
          ? // @ts-ignore - bannedUntil exists in schema
            `You are temporarily banned until ${currentUser.bannedUntil.toLocaleString()}`
          : 'You are banned from matching';
        throw new ApiError(HTTP_STATUS.FORBIDDEN, banMessage);
      }
    }

    // Check if already searching
    const existing = await MatchQueue.findOne({
      userId: req.userId,
      status: 'searching',
    });

    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, ERROR_MESSAGES.ALREADY_SEARCHING);
    }

    // Get blocked users
    const blockedUserIds = await getBlockedUserIds(req.userId);

    // Find available match (excluding users with existing permanent chats)
    const availableMatches = await MatchQueue.find({
      status: 'searching',
      userId: {
        $ne: req.userId,
        $nin: blockedUserIds,
      },
      blockedUserIds: { $ne: req.userId },
      expiresAt: { $gt: new Date() },
    }).sort({ searchStartedAt: 1 });

    // Filter out users who already have a permanent chat with current user
    let availableMatch = null;
    for (const match of availableMatches) {
      const existingChat = await Chat.findOne({
        participants: { $all: [req.userId, match.userId] },
        type: 'permanent',
        isSaved: true,
      });

      if (!existingChat) {
        availableMatch = match;
        break;
      }
    }

    if (availableMatch) {
      // Create temporary chat
      const chat = await Chat.create({
        participants: [req.userId, availableMatch.userId],
        type: 'temporary',
        isTemporary: true,
        expiresAt: new Date(Date.now() + config.chat.temporaryChatExpiryMinutes * 60 * 1000),
        savedBy: [],
        isSaved: false,
        createdBy: req.userId,
      });

      // Update both queue entries
      await MatchQueue.updateMany(
        { userId: { $in: [req.userId, availableMatch.userId] } },
        {
          $set: {
            status: 'matched',
            chatId: chat.chatId,
          },
        }
      );

      // Get BOTH users so we can send each one the other's info
      const [currentUser, matchedUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id: req.userId },
          select: { id: true, name: true, avatar: true },
        }),
        prisma.user.findUnique({
          where: { id: availableMatch.userId },
          select: { id: true, name: true, avatar: true },
        }),
      ]);

      logger.info(`Match found: ${req.userId} <-> ${availableMatch.userId}`);

      // NOTIFY THE WAITING USER (Phone A) via socket
      // The waiting user is already listening for 'match-found' on their
      // userId room (joined automatically in socketHandlers on connect).
      // We grab `io` from the Express app the same way it was attached in server.ts.
      const io: Server | undefined = req.app.get('io');

      if (io) {
        const waitingUserId = availableMatch.userId as string;

        io.to(waitingUserId).emit('match-found', {
          chatId: chat.chatId,
          otherUser: currentUser,   // the waiting user's "other" is the current caller
        });

        logger.info(`Emitted match-found to waiting user room: ${waitingUserId}`);
      } else {
        logger.warn('io not available on app — waiting user will not be notified via socket');
      }
      // END NOTIFY

      // Reply to the CURRENT caller (Phone B) via HTTP as before
      successResponse(res, {
        chatId: chat.chatId,
        otherUser: matchedUser,   // the caller's "other" is the matched (waiting) user
      }, SUCCESS_MESSAGES.MATCH_FOUND);
      return;
    }

    // No match found, add to queue
    // Delete any existing entries first to prevent duplicates
    await MatchQueue.deleteMany({ userId: req.userId });

    // Create new queue entry
    await MatchQueue.create({
      userId: req.userId,
      status: 'searching',
      blockedUserIds,
      searchStartedAt: new Date(),
      expiresAt: new Date(Date.now() + config.chat.matchQueueExpiryMinutes * 60 * 1000),
    });

    logger.info(`User added to match queue: ${req.userId}`);

    successResponse(res, { searching: true }, 'Searching for match...');
  } catch (error) {
    next(error);
  }
};

// Cancel match
export const cancelMatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Delete the match queue entry (works for both 'searching' and 'matched' status)
    const result = await MatchQueue.deleteOne({
      userId: req.userId,
      status: { $in: ['searching', 'matched'] },
    });

    if (result.deletedCount === 0) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No active match search found');
    }

    logger.info(`Match cancelled: ${req.userId}`);

    successResponse(res, null, SUCCESS_MESSAGES.MATCH_CANCELLED);
  } catch (error) {
    next(error);
  }
};

// Get match status
export const getMatchStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const entry = await MatchQueue.findOne({
      userId: req.userId,
      status: { $in: ['searching', 'matched'] },
      expiresAt: { $gt: new Date() },
    });

    if (!entry) {
      successResponse(res, { searching: false });
      return;
    }

    successResponse(res, {
      searching: entry.status === 'searching',
      matched: entry.status === 'matched',
      chatId: entry.chatId,
    });
  } catch (error) {
    next(error);
  }
};
