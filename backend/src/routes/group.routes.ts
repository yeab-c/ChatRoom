import { Router } from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
} from '@/controllers/group.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { validate, schemas } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createGroupSchema = z.object({
  name: schemas.groupName,
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string().uuid()).min(1).max(9),
});

const updateGroupSchema = z.object({
  name: schemas.groupName.optional(),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

const memberSchema = z.object({
  userId: z.string().uuid(),
});

// POST /api/groups - Create group
router.post('/', protectedRoute, validate(createGroupSchema), createGroup);

// GET /api/groups - Get user's groups
router.get('/', protectedRoute, getUserGroups);

// GET /api/groups/:id - Get group details
router.get('/:id', protectedRoute, validate(schemas.id, 'params'), getGroupDetails);

// PUT /api/groups/:id - Update group
router.put('/:id', protectedRoute, validate(schemas.id, 'params'), validate(updateGroupSchema), updateGroup);

// DELETE /api/groups/:id - Delete group
router.delete('/:id', protectedRoute, validate(schemas.id, 'params'), deleteGroup);

// POST /api/groups/:id/members - Add member
router.post('/:id/members', protectedRoute, validate(schemas.id, 'params'), validate(memberSchema), addMember);

// DELETE /api/groups/:id/members - Remove member
router.delete('/:id/members', protectedRoute, validate(schemas.id, 'params'), validate(memberSchema), removeMember);

export default router;
