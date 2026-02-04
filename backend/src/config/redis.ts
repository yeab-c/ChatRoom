import Redis from 'ioredis';
import { config } from './env';
import { logger } from '@/utils/logger';

let redisClient: Redis | null = null;

// Initialize Redis connection
export const initRedis = (): Redis | null => {
  if (!config.redis.url) {
    logger.warn('Redis URL not configured. Caching will be disabled.');
    return null;
  }

  try {
    redisClient = new Redis(config.redis.url, {
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    // Connect
    redisClient.connect().catch((error) => {
      logger.error('Failed to connect to Redis:', error);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    logger.error('Error initializing Redis:', error);
    return null;
  }
};

// Get Redis client
export const getRedisClient = (): Redis | null => {
  return redisClient;
};

// Cache helpers
export const cacheHelpers = {
  async set(key: string, value: any, expirySeconds = 3600): Promise<void> {
    if (!redisClient) return;
    try {
      const stringValue = JSON.stringify(value);
      await redisClient.setex(key, expirySeconds, stringValue);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    if (!redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async del(key: string): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redisClient) return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (!redisClient) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  },
};

// Disconnect Redis
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }
  }
};

export { redisClient };
