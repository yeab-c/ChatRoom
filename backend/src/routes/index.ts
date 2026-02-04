import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import matchRoutes from './match.routes';
import chatRoutes from './chat.routes';
import groupRoutes from './group.routes';
import messageRoutes from './message.routes';
import uploadRoutes from './upload.routes';
import blockRoutes from './block.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/match', matchRoutes);
router.use('/chats', chatRoutes);
router.use('/groups', groupRoutes);
router.use('/messages', messageRoutes);
router.use('/upload', uploadRoutes);
router.use('/block', blockRoutes);
router.use('/admin', adminRoutes);

export default router;