import { Request, Response } from 'express';
import Notification from '../models/notification.model.js';
import User from '../models/User.js';

// Auto-generate inactivity notifications for children who haven't been active 3+ days
async function checkInactiveChildren(parentId: string): Promise<void> {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const oneDayAgo   = new Date(Date.now() -     24 * 60 * 60 * 1000);

    const children = await User.find({ parentId, role: 'child' }).select('_id name lastPlayedDate');

    for (const child of children) {
      const isInactive = !child.lastPlayedDate || (child.lastPlayedDate as Date) < threeDaysAgo;
      if (!isInactive) continue;

      const recentAlert = await Notification.findOne({
        childId: child._id,
        type: 'inactive',
        createdAt: { $gte: oneDayAgo },
      });
      if (recentAlert) continue;

      const daysInactive = child.lastPlayedDate
        ? Math.floor((Date.now() - (child.lastPlayedDate as Date).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const daysText = daysInactive != null ? `${daysInactive} day${daysInactive !== 1 ? 's' : ''}` : 'a while';

      await Notification.create({
        parentId,
        childId:   child._id,
        childName: child.name,
        type:    'inactive',
        title:   `${child.name} hasn't been active`,
        message: `${child.name} hasn't been active for ${daysText}. Encourage them to continue their learning journey!`,
        icon:    '😴',
        read:    false,
      });
    }
  } catch (err) {
    console.error('checkInactiveChildren error (non-fatal):', err);
  }
}

// GET /parent/notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;

    await checkInactiveChildren(parentId);

    const notifications = await Notification.find({ parentId })
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// GET /parent/notifications/unread-count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;
    const count = await Notification.countDocuments({ parentId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch count.' });
  }
};

// PATCH /parent/notifications/read-all
export const markAllRead = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;
    await Notification.updateMany({ parentId, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed.' });
  }
};

// PATCH /parent/notifications/:id/read
export const markRead = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;
    const { id } = req.params;
    await Notification.updateOne({ _id: id, parentId }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed.' });
  }
};

// DELETE /parent/notifications/:id
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;
    const { id } = req.params;
    await Notification.deleteOne({ _id: id, parentId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed.' });
  }
};
