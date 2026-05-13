import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  deleteNotification,
} from '../controllers/adminNotification.controller.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
