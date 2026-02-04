import { cacheHelpers } from '@/config/redis';
import { CACHE_KEYS, CACHE_TTL } from '@/config/constants';
import { logger } from './logger';

// Cache user profile
export const cacheUserProfile = async (userId: string, data: any): Promise<void> => {
  try {
    await cacheHelpers.set(
      CACHE_KEYS.USER_PROFILE(userId),
      data,
      CACHE_TTL.USER_PROFILE
    );
  } catch (error) {
    logger.error('Error caching user profile:', error);
  }
};

// Get cached user profile
export const getCachedUserProfile = async (userId: string): Promise<any | null> => {
  try {
    return await cacheHelpers.get(CACHE_KEYS.USER_PROFILE(userId));
  } catch (error) {
    logger.error('Error getting cached user profile:', error);
    return null;
  }
};

// Invalidate user profile cache
export const invalidateUserProfileCache = async (userId: string): Promise<void> => {
  try {
    await cacheHelpers.del(CACHE_KEYS.USER_PROFILE(userId));
  } catch (error) {
    logger.error('Error invalidating user profile cache:', error);
  }
};

// Cache blocked users list
export const cacheBlockedUsers = async (userId: string, blockedIds: string[]): Promise<void> => {
  try {
    await cacheHelpers.set(
      CACHE_KEYS.BLOCKED_USERS(userId),
      blockedIds,
      CACHE_TTL.USER_PROFILE
    );
  } catch (error) {
    logger.error('Error caching blocked users:', error);
  }
};

// Get cached blocked users
export const getCachedBlockedUsers = async (userId: string): Promise<string[] | null> => {
  try {
    return await cacheHelpers.get<string[]>(CACHE_KEYS.BLOCKED_USERS(userId));
  } catch (error) {
    logger.error('Error getting cached blocked users:', error);
    return null;
  }
};

// Invalidate blocked users cache
export const invalidateBlockedUsersCache = async (userId: string): Promise<void> => {
  try {
    await cacheHelpers.del(CACHE_KEYS.BLOCKED_USERS(userId));
  } catch (error) {
    logger.error('Error invalidating blocked users cache:', error);
  }
};

// Cache online users list
export const cacheOnlineUsers = async (userIds: string[]): Promise<void> => {
  try {
    await cacheHelpers.set(
      CACHE_KEYS.ONLINE_USERS,
      userIds,
      CACHE_TTL.ONLINE_USERS
    );
  } catch (error) {
    logger.error('Error caching online users:', error);
  }
};

// Get cached online users
export const getCachedOnlineUsers = async (): Promise<string[] | null> => {
  try {
    return await cacheHelpers.get<string[]>(CACHE_KEYS.ONLINE_USERS);
  } catch (error) {
    logger.error('Error getting cached online users:', error);
    return null;
  }
};

// Cache with pattern invalidation
export const invalidateCachePattern = async (pattern: string): Promise<void> => {
  try {
    await cacheHelpers.delPattern(pattern);
  } catch (error) {
    logger.error(`Error invalidating cache pattern ${pattern}:`, error);
  }
};
