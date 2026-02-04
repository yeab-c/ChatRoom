import { Router } from 'express';
import { getSavedChats, saveChat, deleteChat, createGroupMemberChat, getChatDetails, terminateChat } from '@/controllers/chat.controller';
import { protectedRoute } from '@/middleware/auth.middleware';
import { validate, schemas } from '@/middleware/validation.middleware';

const router = Router();

// GET /api/chats - Get saved chats
router.get('/', protectedRoute, validate(schemas.pagination, 'query'), getSavedChats);

// GET /api/chats/:chatId - Get chat details
router.get('/:chatId', protectedRoute, getChatDetails);

// POST /api/chats/:chatId/save - Save chat
router.post('/:chatId/save', protectedRoute, saveChat);

// POST /api/chats/:chatId/terminate - Terminate temporary chat
router.post('/:chatId/terminate', protectedRoute, terminateChat);

// POST /api/chats/group-member-chat - Create chat between group members
router.post('/group-member-chat', protectedRoute, createGroupMemberChat);

// DELETE /api/chats/:chatId - Delete chat
router.delete('/:chatId', protectedRoute, deleteChat);

export default router;