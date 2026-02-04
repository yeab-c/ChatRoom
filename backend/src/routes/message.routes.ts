import { Router } from 'express';
import { sendMessage, getMessages, markAsRead, deleteMessage } from '@/controllers/message.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { validate, schemas } from '@/middleware/validation.middleware';
import { messageLimiter } from '@/middleware/rateLimit.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const sendMessageSchema = z.object({
  chatId: z.string().min(1),
  chatType: z.enum(['one-on-one', 'group']).optional(),
  type: z.enum(['text', 'image']),
  content: schemas.messageContent,
  imageUrl: z.string().url().optional(),
  replyTo: z.string().optional(),
});

// POST /api/messages - Send message
router.post('/', protectedRoute, messageLimiter, validate(sendMessageSchema), sendMessage);

// GET /api/messages/:chatId - Get messages
router.get('/:chatId', protectedRoute, validate(schemas.pagination, 'query'), getMessages);

// PUT /api/messages/:messageId/read - Mark as read
router.put('/:messageId/read', protectedRoute, markAsRead);

// DELETE /api/messages/:messageId - Delete message
router.delete('/:messageId', protectedRoute, deleteMessage);

export default router;