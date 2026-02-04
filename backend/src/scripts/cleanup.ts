import { Chat, MatchQueue } from '@/models/mongodb.models';
import { logger } from '@/utils/logger';
import { connectMongoDB, connectPostgreSQL, disconnectDatabases } from '@/config/database';

// Cleanup expired temporary chats
const cleanupExpiredChats = async (): Promise<number> => {
  try {
    const result = await Chat.deleteMany({
      isTemporary: true,
      expiresAt: { $lte: new Date() },
    });

    if (result.deletedCount > 0) {
      logger.info(`Cleaned up ${result.deletedCount} expired temporary chats`);
    }

    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired chats:', error);
    return 0;
  }
};

// Cleanup expired match queue entries
const cleanupExpiredMatches = async (): Promise<number> => {
  try {
    const result = await MatchQueue.updateMany(
      {
        status: 'searching',
        expiresAt: { $lte: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Cleaned up ${result.modifiedCount} expired match searches`);
    }

    return result.modifiedCount;
  } catch (error) {
    logger.error('Error cleaning up expired matches:', error);
    return 0;
  }
};

// Main cleanup function
const runCleanup = async (): Promise<void> => {
  try {
    logger.info('Starting cleanup tasks...');

    // Connect to databases
    await connectPostgreSQL();
    await connectMongoDB();

    // Run cleanup tasks
    const [expiredChats, expiredMatches] = await Promise.all([
      cleanupExpiredChats(),
      cleanupExpiredMatches(),
    ]);

    logger.info(`Cleanup complete: ${expiredChats} chats, ${expiredMatches} matches removed`);

    // Disconnect
    await disconnectDatabases();

    process.exit(0);
  } catch (error) {
    logger.error('Cleanup error:', error);
    process.exit(1);
  }
};

// Run cleanup if executed directly
if (require.main === module) {
  runCleanup();
}

export { runCleanup, cleanupExpiredChats, cleanupExpiredMatches };
