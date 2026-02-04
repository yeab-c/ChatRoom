import { Router } from 'express';
import { syncUser, getCurrentUser, logout } from '@/controllers/auth.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { authLimiter } from '@/middleware/rateLimit.middleware';

const router = Router();

// POST /api/auth/sync - Sync user from Clerk
router.post('/sync', authLimiter, syncUser);

// GET /api/auth/me - Get current user
router.get('/me', protectedRoute, getCurrentUser);

// POST /api/auth/logout - Logout
router.post('/logout', protectedRoute, logout);

export default router;