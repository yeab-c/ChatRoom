import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from '@/middleware/socket.middleware';
import { getRedisClient } from '@/config/redis';
import { prisma } from '@/config/database';
import { Chat } from '@/models/mongodb.models';
import { logger } from '@/utils/logger';

const MATCH_QUEUE_KEY = 'match:queue';
const MATCH_TIMEOUT = 30000; // 30 seconds


 // Setup matching-related socket handlers

export const setupMatchingHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // Cast to AuthenticatedSocket after connection
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.userId;

    // When user starts searching for match
    socket.on('start-matching', async () => {
      try {
        await handleStartMatching(authSocket, io, userId);
      } catch (error) {
        logger.error('Error starting match:', error);
        socket.emit('match-error', { message: 'Failed to start matching' });
      }
    });

    // When user cancels match search
    socket.on('cancel-matching', async () => {
      try {
        await handleCancelMatching(authSocket, userId);
      } catch (error) {
        logger.error('Error canceling match:', error);
      }
    });
  });
};


 // Handle start matching

const handleStartMatching = async (
  socket: AuthenticatedSocket,
  io: Server,
  userId: string
) => {
  const redis = getRedisClient();

  // Check if user is already in queue
  if (redis) {
    const inQueue = await redis.sismember(MATCH_QUEUE_KEY, userId);
    if (inQueue) {
      socket.emit('match-error', { message: 'Already searching for match' });
      return;
    }
  }

  // Get blocked users
  const blockedRelations = await prisma.blockedUser.findMany({
    where: {
      OR: [
        { blockerId: userId },
        { blockedId: userId },
      ],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  const blockedUserIds = blockedRelations.map((rel) =>
    rel.blockerId === userId ? rel.blockedId : rel.blockerId
  );

  // Get all users in queue (excluding blocked users)
  let availableUsers: string[] = [];

  if (redis) {
    const queueMembers = await redis.smembers(MATCH_QUEUE_KEY);
    availableUsers = queueMembers.filter(
      (id) => id !== userId && !blockedUserIds.includes(id)
    );
  }

  if (availableUsers.length > 0) {
    // Match found immediately - use FIFO (first user in queue)
    const partnerId = availableUsers[0] as string;

    // Remove partner from queue
    if (redis) {
      await redis.srem(MATCH_QUEUE_KEY, partnerId);
    }

    // Create chat
    const { chatId } = await createMatchChat(userId, partnerId);

    // Get user details for both users
    const [user, partner] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, avatar: true, email: true },
      }),
      prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, avatar: true, email: true },
      }),
    ]);

    logger.info(`Match found: ${user?.name} (${userId}) ↔ ${partner?.name} (${partnerId})`);
    logger.info(`Current socket ID: ${socket.id}`);
    logger.info(`Emitting to userId room: ${userId}`);
    logger.info(`Emitting to partnerId room: ${partnerId}`);

    // Prepare match data for both users
    const matchDataForUser = {
      chatId,
      otherUser: partner,
    };

    const matchDataForPartner = {
      chatId,
      otherUser: user,
    };

    // Emit to current socket (Phone A - the one who just started matching)
    socket.emit('match-found', matchDataForUser);
    logger.info(`Emitted match-found to current socket (${socket.id})`);

    // Emit to userId room (in case of multiple devices for Phone A)
    io.to(userId).emit('match-found', matchDataForUser);
    logger.info(`Emitted match-found to userId room: ${userId}`);

    // Emit to partnerId room (Phone B - the user who was waiting in queue)
    io.to(partnerId).emit('match-found', matchDataForPartner);
    logger.info(`Emitted match-found to partnerId room: ${partnerId}`);

    // Also get all sockets in the partnerId room and emit directly
    const partnerSockets = await io.in(partnerId).fetchSockets();
    logger.info(`Found ${partnerSockets.length} socket(s) in partnerId room`);

    partnerSockets.forEach((partnerSocket) => {
      partnerSocket.emit('match-found', matchDataForPartner);
      logger.info(`Directly emitted to partner socket: ${partnerSocket.id}`);
    });

    logger.info(`All match-found events emitted successfully`);
  } else {
    // No users in queue - add current user
    if (redis) {
      await redis.sadd(MATCH_QUEUE_KEY, userId);
    }
    socket.emit('match-searching');

    logger.info(`User added to queue: ${socket.user?.email}`);

    // Set timeout
    setTimeout(async () => {
      if (redis) {
        const stillInQueue = await redis.sismember(MATCH_QUEUE_KEY, userId);
        if (stillInQueue) {
          await redis.srem(MATCH_QUEUE_KEY, userId);
          socket.emit('match-timeout');
          logger.info(`Match timeout for: ${socket.user?.email}`);
        }
      } else {
        // No Redis - just timeout
        socket.emit('match-timeout');
        logger.info(`Match timeout for: ${socket.user?.email}`);
      }
    }, MATCH_TIMEOUT);
  }
};


 // Handle cancel matching

const handleCancelMatching = async (socket: AuthenticatedSocket, userId: string) => {
  const redis = getRedisClient();

  if (redis) {
    await redis.srem(MATCH_QUEUE_KEY, userId);
  }

  socket.emit('match-cancelled');
  logger.info(`Match cancelled: ${socket.user?.email}`);
};


 //Create a chat between matched users

const createMatchChat = async (userId1: string, userId2: string) => {
  // Create in MongoDB first to get the chat ID
  const mongoChat = await Chat.create({
    chatId: '', // Will be set after Prisma creation
    participants: [userId1, userId2],
    type: 'temporary',
    isTemporary: true,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    savedBy: [],
    isSaved: false,
    createdBy: userId1,
  });

  // Update MongoDB with the Mongo ID as chatId
  mongoChat.chatId = mongoChat._id.toString();
  await mongoChat.save();

  // Create SavedChat entries for both users in PostgreSQL
  await Promise.all([
    prisma.savedChat.create({
      data: {
        userId: userId1,
        otherUserId: userId2,
        mongoChatId: mongoChat.chatId,
        lastMessageAt: new Date(),
        lastMessagePreview: '',
        unreadCount: 0,
      },
    }),
    prisma.savedChat.create({
      data: {
        userId: userId2,
        otherUserId: userId1,
        mongoChatId: mongoChat.chatId,
        lastMessageAt: new Date(),
        lastMessagePreview: '',
        unreadCount: 0,
      },
    }),
  ]);

  return { chatId: mongoChat.chatId, chat: mongoChat };
};