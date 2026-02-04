import { Router } from 'express';
import { startMatch, cancelMatch, getMatchStatus } from '@/controllers/match.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { matchLimiter } from '@/middleware/rateLimit.middleware';

const router = Router();

// POST /api/match/start - Start random match
router.post('/start', protectedRoute, matchLimiter, startMatch);

// POST /api/match/cancel - Cancel match search
router.post('/cancel', protectedRoute, cancelMatch);

// GET /api/match/status - Get match status
router.get('/status', protectedRoute, getMatchStatus);

export default router;