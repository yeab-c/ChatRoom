import { Router } from 'express';
import { blockUser, unblockUser, getBlockedUsers } from '@/controllers/block.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Validation schema
const blockUserSchema = z.object({
  userId: z.string().uuid(),
});

// POST /api/block - Block user
router.post('/', protectedRoute, validate(blockUserSchema), blockUser);

// DELETE /api/block/:userId - Unblock user
router.delete('/:userId', protectedRoute, unblockUser);

// GET /api/block - Get blocked users
router.get('/', protectedRoute, getBlockedUsers);

export default router;