import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from '@/middleware/socket.middleware';
import { prisma } from '@/config/database';
import { Chat, Message } from '@/models/mongodb.models';
import { logger } from '@/utils/logger';
import { setupMatchingHandlers } from './matchingHandlers';


 // Setup all socket event handlers

export const setupSocketHandlers = (io: Server) => {
  // Setup matching handlers
  setupMatchingHandlers(io);

  io.on('connection', (socket: Socket) => {
    // Cast to AuthenticatedSocket
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.userId;
    
    logger.info(`User connected: ${authSocket.user?.email} (${socket.id})`);

    // Join user's personal room (for notifications)
    socket.join(userId);

    // User comes online
    handleUserOnline(authSocket, userId);

    // Chat events
    handleChatEvents(authSocket, io, userId);

    // Typing events
    handleTypingEvents(authSocket, io, userId);

    // Message read events
    handleReadEvents(authSocket, io, userId);

    // Group events
    handleGroupEvents(authSocket, io, userId);

    // Disconnect event
    socket.on('disconnect', () => {
      handleUserOffline(authSocket, userId);
      logger.info(`User disconnected: ${authSocket.user?.email}`);
    });
  });
};


 // Handle user online status

const handleUserOnline = async (socket: AuthenticatedSocket, userId: string) => {
  try {
    // Update user status in database
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    });

    // Broadcast to all connected users
    socket.broadcast.emit('user-online', userId);
  } catch (error) {
    logger.error('Error handling user online:', error);
  }
};


 // Handle user offline status
 
const handleUserOffline = async (socket: AuthenticatedSocket, userId: string) => {
  try {
    // Update user status in database
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeen: new Date() },
    });

    // Broadcast to all connected users
    socket.broadcast.emit('user-offline', userId);
  } catch (error) {
    logger.error('Error handling user offline:', error);
  }
};

/**
 * Handle chat-related events
 */
const handleChatEvents = (socket: AuthenticatedSocket, io: Server, userId: string) => {
  // Join a chat room
  socket.on('join-chat', ({ chatId }: { chatId: string }) => {
    socket.join(`chat:${chatId}`);
    logger.info(`${socket.user?.email} joined chat: ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave-chat', ({ chatId }: { chatId: string }) => {
    socket.leave(`chat:${chatId}`);
    logger.info(`${socket.user?.email} left chat: ${chatId}`);
  });

  // Send message
  socket.on('send-message', async (data: {
    chatId: string;
    type: 'text' | 'image';
    content: string;
    imageUrl?: string;
    chatType?: 'one-on-one' | 'group';
  }) => {
    try {
      const { chatId, type, content, imageUrl, chatType = 'one-on-one' } = data;

      // Save message to MongoDB using Message model
      const newMessage = await Message.create({
        chatId,
        chatType,
        senderId: userId,
        type,
        content,
        imageUrl,
        readBy: [userId], // Sender has read their own message
        deliveredTo: [userId],
      });

      // Update last message based on chat type
      const messagePreview = type === 'text' ? content.substring(0, 100) : '[Photo]';
      
      if (chatType === 'group') {
        // Update GroupChat
        const { GroupChat } = await import('@/models/mongodb.models');
        await GroupChat.findOneAndUpdate(
          { groupId: chatId },
          {
            $set: {
              lastMessageId: newMessage._id,
              lastMessageAt: new Date(),
              lastMessagePreview: messagePreview,
            },
          }
        );

        // Emit to group room
        io.to(`group:${chatId}`).emit('new-message', {
          id: newMessage._id.toString(),
          chatId,
          sender: socket.user,
          type: newMessage.type,
          content: newMessage.content,
          imageUrl: newMessage.imageUrl,
          readBy: newMessage.readBy,
          deliveredTo: newMessage.deliveredTo,
          createdAt: newMessage.createdAt,
        });
      } else {
        // Update Chat for one-on-one
        await Chat.updateOne(
          { chatId },
          {
            $set: {
              lastMessageId: newMessage._id,
              lastMessageAt: new Date(),
              lastMessagePreview: messagePreview,
            },
          }
        );

        // Update PostgreSQL saved chats with last message
        await prisma.savedChat.updateMany({
          where: { mongoChatId: chatId },
          data: {
            lastMessagePreview: messagePreview,
            lastMessageAt: new Date(),
          },
        });

        // Emit to chat room
        io.to(`chat:${chatId}`).emit('new-message', {
          id: newMessage._id.toString(),
          chatId,
          sender: socket.user,
          type: newMessage.type,
          content: newMessage.content,
          imageUrl: newMessage.imageUrl,
          readBy: newMessage.readBy,
          deliveredTo: newMessage.deliveredTo,
          createdAt: newMessage.createdAt,
        });
      }

      logger.info(`Message sent in ${chatType} chat ${chatId} by ${socket.user?.email}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};


 // Handle typing indicators

const handleTypingEvents = (socket: AuthenticatedSocket, io: Server, userId: string) => {
  // User is typing
  socket.on('typing', ({ chatId }: { chatId: string }) => {
    socket.to(`chat:${chatId}`).emit('user-typing', {
      chatId,
      userId,
      userName: socket.user?.name,
    });
  });

  // User stopped typing
  socket.on('stop-typing', ({ chatId }: { chatId: string }) => {
    socket.to(`chat:${chatId}`).emit('user-stop-typing', {
      chatId,
      userId,
      userName: socket.user?.name,
    });
  });
};


 // Handle message read events

const handleReadEvents = (socket: AuthenticatedSocket, io: Server, userId: string) => {
  socket.on('mark-read', async (data: {
    chatId: string;
    messageIds: string[];
  }) => {
    try {
      const { chatId, messageIds } = data;

      // Update MongoDB - add userId to readBy array in Message model
      await Message.updateMany(
        { 
          chatId,
          _id: { $in: messageIds }
        },
        {
          $addToSet: { readBy: userId },
        }
      );

      // Notify other users in chat
      socket.to(`chat:${chatId}`).emit('messages-read', {
        userId,
        messageIds,
      });

      logger.info(`Messages marked as read in chat ${chatId}`);
    } catch (error) {
      logger.error('Error marking messages as read:', error);
    }
  });
};


 // Handle group events

const handleGroupEvents = (socket: AuthenticatedSocket, io: Server, userId: string) => {
  // Join group
  socket.on('join-group', ({ groupId }: { groupId: string }) => {
    socket.join(`group:${groupId}`);
    logger.info(` ${socket.user?.email} joined group: ${groupId}`);
  });

  // Leave group
  socket.on('leave-group', ({ groupId }: { groupId: string }) => {
    socket.leave(`group:${groupId}`);
    logger.info(`${socket.user?.email} left group: ${groupId}`);
  });

  // Group update (member added/removed, name changed, etc.)
  socket.on('group-update', (data: { groupId: string; type: string; data: any }) => {
    io.to(`group:${data.groupId}`).emit('group-update', data);
  });
};