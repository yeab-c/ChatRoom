import { clerkMiddleware, requireAuth } from '@clerk/express';
import { config } from './env';

// Clerk middleware configuration
export const clerk = clerkMiddleware({
  publishableKey: config.clerk.publishableKey,
  secretKey: config.clerk.secretKey,
});

// Protected route middleware
export const protectedRoute = requireAuth();

// Verify email domain restriction
export const isAllowedEmail = (email: string): boolean => {
  const domain = email.split('@')[1];
  return domain === config.clerk.allowedEmailDomain;
};

// Extract user ID from Clerk auth
export const getUserIdFromAuth = (auth: any): string | null => {
  return auth?.userId || null;
};