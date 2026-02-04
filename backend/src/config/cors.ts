import { CorsOptions } from 'cors';
import { config } from './env';

// Parse CORS origin from environment variable
const parseOrigin = (origin: string): string | string[] => {
  if (origin.includes(',')) {
    return origin.split(',').map((o) => o.trim());
  }
  return origin;
};

// CORS configuration
export const corsOptions: CorsOptions = {
  origin: parseOrigin(config.cors.origin),
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};