import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_VERSION: z.string().default('v1'),

  // PostgreSQL
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Redis (optional)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Clerk (@clerk/express)
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  ALLOWED_EMAIL_DOMAIN: z.string().default('bitscollege.edu.et'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:8081,http://localhost:19006'),
  CORS_CREDENTIALS: z.string().transform((val) => val === 'true').default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('3600000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Chat Configuration
  TEMPORARY_CHAT_EXPIRY_MINUTES: z.string().transform(Number).default('15'),
  MATCH_QUEUE_EXPIRY_MINUTES: z.string().transform(Number).default('5'),
  MAX_GROUP_MEMBERS: z.string().transform(Number).default('10'),
  MAX_MESSAGE_LENGTH: z.string().transform(Number).default('5000'),

  // File Upload
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('5'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/jpg,image/webp'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),

  // Admin
  ADMIN_EMAIL: z.string().email().optional(),
});

// Validate environment variables
const validateEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Validated environment variables
const env = validateEnv();

// Export configuration object
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Database
  database: {
    postgresUrl: env.DATABASE_URL,
    mongoUri: env.MONGODB_URI,
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
  },

  // Clerk
  clerk: {
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
    allowedEmailDomain: env.ALLOWED_EMAIL_DOMAIN,
  },

  // Cloudinary
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Chat
  chat: {
    temporaryChatExpiryMinutes: env.TEMPORARY_CHAT_EXPIRY_MINUTES,
    matchQueueExpiryMinutes: env.MATCH_QUEUE_EXPIRY_MINUTES,
    maxGroupMembers: env.MAX_GROUP_MEMBERS,
    maxMessageLength: env.MAX_MESSAGE_LENGTH,
  },

  // Upload
  upload: {
    maxFileSizeMB: env.MAX_FILE_SIZE_MB,
    maxFileSizeBytes: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    allowedFileTypes: env.ALLOWED_FILE_TYPES.split(','),
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
  },

  // Admin
  admin: {
    email: env.ADMIN_EMAIL,
  },
} as const;

export type Config = typeof config;