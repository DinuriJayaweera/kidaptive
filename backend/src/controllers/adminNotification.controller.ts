import { Request, Response } from 'express';
import AdminNotification from '../models/adminNotification.model.js';
import { checkQuestionBanks, checkHighActivity } from '../services/adminNotification.service.js';

// GET /admin/notifications
export const getNotifications = async (_req: Request, res: Response) => {
  try {
    // Lazy health checks — run in parallel, non-blocking on failure
    await Promise.allSettled([checkQuestionBanks(), checkHighActivity()]);

    const notifications = await AdminNotification.find()
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// GET /admin/notifications/unread-count
export const getUnreadCount = async (_req: Request, res: Response) => {
  try {
    const count = await AdminNotification.countDocuments({ read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch count.' });
  }
};

// PATCH /admin/notifications/read-all
export const markAllRead = async (_req: Request, res: Response) => {
  try {
    await AdminNotification.updateMany({ read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed.' });
  }
};

// PATCH /admin/notifications/:id/read
export const markRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await AdminNotification.updateOne({ _id: id }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed.' });
  }
};

// DELETE /admin/notifications/:id
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await AdminNotification.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed.' });
  }
};
