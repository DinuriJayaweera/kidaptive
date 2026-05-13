import User from '../models/User.js';
import Notification, { type NotificationType } from '../models/notification.model.js';

export async function createNotification(
  childId: string,
  type: NotificationType,
  title: string,
  message: string,
  icon = '🔔',
): Promise<void> {
  try {
    const child = await User.findById(childId).select('parentId name');
    if (!child?.parentId) return;

    await Notification.create({
      parentId:  child.parentId,
      childId,
      childName: child.name,
      type,
      title,
      message,
      icon,
      read: false,
    });
  } catch (err) {
    console.error('createNotification error (non-fatal):', err);
  }
}
