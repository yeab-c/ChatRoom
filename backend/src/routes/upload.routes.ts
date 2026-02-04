import { Router } from 'express';
import { uploadProfilePicture, uploadMessageImage, uploadGroupAvatar } from '@/controllers/upload.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { uploadSingle, validateFile } from '@/middleware/upload.middleware';
import { uploadLimiter } from '@/middleware/rateLimit.middleware';

const router = Router();

// POST /api/upload/profile - Upload profile picture
router.post(
  '/profile',
  protectedRoute,
  uploadLimiter,
  uploadSingle('image'),
  validateFile,
  uploadProfilePicture
);

// POST /api/upload/message - Upload message image
router.post(
  '/message',
  protectedRoute,
  uploadLimiter,
  uploadSingle('image'),
  validateFile,
  uploadMessageImage
);

// POST /api/upload/group - Upload group avatar
router.post(
  '/group',
  protectedRoute,
  uploadLimiter,
  uploadSingle('image'),
  validateFile,
  uploadGroupAvatar
);

export default router;
