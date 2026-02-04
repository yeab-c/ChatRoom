import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '@/config/env';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/config/constants';
import { logger } from '@/utils/logger';

// Custom key generator using user ID if available
const keyGenerator = (req: Request): string => {
  return req.userId || req.ip || 'anonymous';
};

// Custom handler for rate limit exceeded
const handler = (req: Request, res: Response): void => {
  logger.warn(`Rate limit exceeded for ${keyGenerator(req)}`);
  
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  });
};

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
  skip: (req) => {
    // Skip rate limiting in development for easier testing
    return process.env['NODE_ENV'] === 'development';
  },
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator,
  handler,
});

// Message sending rate limiter
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many messages. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
});

// Match request rate limiter
export const matchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many match requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
});

// Image upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many upload requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
});

// Report submission rate limiter
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many reports submitted. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
});