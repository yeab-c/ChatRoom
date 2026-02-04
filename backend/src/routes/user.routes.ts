import { Router } from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  updateUserAvatar, 
  getUserStats,
  reportUser,
  blockUser,
  unblockUser,
  getBlockedUsers
} from '@/controllers/user.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { validate, schemas } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  name: schemas.name.optional(),
  bio: z.string().max(500).optional(),
  gender: z.string().optional(),
  age: z.number().int().min(16).max(100).optional(),
  country: z.string().max(50).optional(),
  hobbies: z.string().max(500).optional(),
});

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url(),
});

const reportSchema = z.object({
  reason: z.string().min(10).max(500),
  chatId: z.string().optional(),
});

// GET /api/users/:id - Get user profile
router.get('/:id', protectedRoute, validate(schemas.id, 'params'), getUserProfile);

// PUT /api/users/me - Update own profile
router.put('/me', protectedRoute, validate(updateProfileSchema), updateUserProfile);

// PUT /api/users/me/avatar - Update avatar
router.put('/me/avatar', protectedRoute, validate(updateAvatarSchema), updateUserAvatar);

// GET /api/users/me/stats - Get user statistics
router.get('/me/stats', protectedRoute, getUserStats);

// POST /api/users/:userId/report - Report user
router.post('/:userId/report', protectedRoute, validate(reportSchema), reportUser);

// POST /api/users/:userId/block - Block user
router.post('/:userId/block', protectedRoute, blockUser);

// DELETE /api/users/:userId/block - Unblock user
router.delete('/:userId/block', protectedRoute, unblockUser);

// GET /api/users/me/blocked - Get blocked users
router.get('/me/blocked', protectedRoute, getBlockedUsers);

export default router;