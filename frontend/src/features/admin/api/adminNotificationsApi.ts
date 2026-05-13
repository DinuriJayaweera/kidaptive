import api from "../../../services/apiClient";

export type AdminNotificationType =
  | "new_parent"
  | "new_child"
  | "placement_completed"
  | "champion_reached"
  | "question_bank_low"
  | "daily_quest_low"
  | "high_activity"
  | "system_error";

export interface AdminNotification {
  _id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<{ notifications: AdminNotification[]; unreadCount: number }> => {
  const { data } = await api.get("/admin/notifications");
  return data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await api.get("/admin/notifications/unread-count");
  return data.count as number;
};

export const markRead = async (id: string): Promise<void> => {
  await api.patch(`/admin/notifications/${id}/read`);
};

export const markAllRead = async (): Promise<void> => {
  await api.patch("/admin/notifications/read-all");
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/admin/notifications/${id}`);
};
