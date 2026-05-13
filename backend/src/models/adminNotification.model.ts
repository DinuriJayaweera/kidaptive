import mongoose, { Document, Schema } from 'mongoose';

export type AdminNotificationType =
  | 'new_parent'
  | 'new_child'
  | 'placement_completed'
  | 'champion_reached'
  | 'question_bank_low'
  | 'daily_quest_low'
  | 'high_activity'
  | 'system_error';

export interface IAdminNotification extends Document {
  type: AdminNotificationType;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: ['new_parent', 'new_child', 'placement_completed', 'champion_reached', 'question_bank_low', 'daily_quest_low', 'high_activity', 'system_error'],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    icon:    { type: String, default: '🔔' },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

adminNotificationSchema.index({ createdAt: -1 });
adminNotificationSchema.index({ read: 1 });

export default mongoose.model<IAdminNotification>('AdminNotification', adminNotificationSchema);
