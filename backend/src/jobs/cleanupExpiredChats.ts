import { Chat } from '@/models/mongodb.models';
import { logger } from '@/utils/logger';


 //Cleanup expired temporary chats
 //This job should run every minute to check for expired chats
 
export const cleanupExpiredChats = async () => {
  try {
    const now = new Date();

    // Find all temporary chats that have expired
    const expiredChats = await Chat.find({
      isTemporary: true,
      expiresAt: { $lte: now },
    });

    if (expiredChats.length === 0) {
      return;
    }

    logger.info(`Found ${expiredChats.length} expired temporary chats to clean up`);

    // Delete expired chats
    for (const chat of expiredChats) {
      await Chat.deleteOne({ chatId: chat.chatId });
      logger.info(`Deleted expired temporary chat: ${chat.chatId}`);
    }

    logger.info(`Cleaned up ${expiredChats.length} expired temporary chats`);
  } catch (error) {
    logger.error('Error cleaning up expired chats:', error);
  }
};


 // Start the cleanup job
 // Runs every minute

export const startCleanupJob = () => {
  // Run immediately on start
  cleanupExpiredChats();

  // Then run every minute
  setInterval(cleanupExpiredChats, 60 * 1000); // 60 seconds

  logger.info('✓ Cleanup job started - checking for expired chats every minute');
};
