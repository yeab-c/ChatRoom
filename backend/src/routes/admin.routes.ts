import { Router } from 'express';
import { getAdminStats, getReports, reviewReport, banUser, unbanUser } from '@/controllers/admin.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { adminOnly } from '@/middleware/admin.middleware';
import { validate, schemas } from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// All admin routes require admin authorization
router.use(protectedRoute, adminOnly);

// Validation schemas
const reviewReportSchema = z.object({
  status: z.enum(['reviewed', 'resolved', 'dismissed']),
  reviewNotes: z.string().max(1000).optional(),
});

const banUserSchema = z.object({
  reason: z.string().min(10),
});

// GET /api/admin/stats - Get admin statistics
router.get('/stats', getAdminStats);

// GET /api/admin/reports - Get all reports
router.get('/reports', getReports);

// PUT /api/admin/reports/:id - Review report
router.put('/reports/:id', validate(schemas.id, 'params'), validate(reviewReportSchema), reviewReport);

// POST /api/admin/ban/:userId - Ban user
router.post('/ban/:userId', validate(banUserSchema), banUser);

// POST /api/admin/unban/:userId - Unban user
router.post('/unban/:userId', unbanUser);

export default router;
