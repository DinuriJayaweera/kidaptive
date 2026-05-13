import api from "../../../services/apiClient";

export type NotificationType =
  | "level_up"
  | "champion"
  | "achievement"
  | "daily_quest"
  | "streak_milestone"
  | "gems_milestone"
  | "inactive";

export interface ParentNotification {
  _id: string;
  parentId: string;
  childId: string;
  childName: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<{ notifications: ParentNotification[]; unreadCount: number }> => {
  const { data } = await api.get("/parent/notifications");
  return data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await api.get("/parent/notifications/unread-count");
  return data.count as number;
};

export const markRead = async (id: string): Promise<void> => {
  await api.patch(`/parent/notifications/${id}/read`);
};

export const markAllRead = async (): Promise<void> => {
  await api.patch("/parent/notifications/read-all");
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/parent/notifications/${id}`);
};
