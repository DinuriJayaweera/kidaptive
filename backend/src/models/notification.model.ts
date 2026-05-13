import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'level_up'
  | 'champion'
  | 'achievement'
  | 'daily_quest'
  | 'streak_milestone'
  | 'gems_milestone'
  | 'inactive'
  | 'password_reset_request';

export interface INotification extends Document {
  parentId: Types.ObjectId;
  childId: Types.ObjectId;
  childName: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    parentId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    childId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    childName: { type: String, required: true },
    type: {
      type: String,
      enum: ['level_up', 'champion', 'achievement', 'daily_quest', 'streak_milestone', 'gems_milestone', 'inactive', 'password_reset_request'],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    icon:    { type: String, default: '🔔' },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ parentId: 1, createdAt: -1 });
notificationSchema.index({ parentId: 1, read: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
