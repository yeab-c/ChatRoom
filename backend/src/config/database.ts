import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '@/utils/logger';

// Prisma Client (PostgreSQL)
export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// MongoDB Connection
export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.database.mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully');

    // Handle MongoDB connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// PostgreSQL Connection Test
export const connectPostgreSQL = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected successfully');

    // Test query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('PostgreSQL query test passed');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabases = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('PostgreSQL disconnected');

    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting databases:', error);
  }
};

// Initialize all database connections
export const initializeDatabases = async (): Promise<void> => {
  await connectPostgreSQL();
  await connectMongoDB();
};

export { mongoose };