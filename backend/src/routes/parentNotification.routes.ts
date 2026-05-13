import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  deleteNotification,
} from '../controllers/parentNotification.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('parent'));

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);     // must come before /:id
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
