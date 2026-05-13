import mongoose, { Document, Schema, Types } from 'mongoose';

export type ResetRequestStatus = 'pending' | 'otp_sent' | 'completed' | 'expired';

export interface IPasswordResetRequest extends Document {
  childId:     Types.ObjectId;
  parentId:    Types.ObjectId;
  childName:   string;
  status:      ResetRequestStatus;
  expiresAt:   Date;
  otpHash?:    string;
  otpExpiry?:  Date;
  otpAttempts: number;
  createdAt:   Date;
  updatedAt:   Date;
}

const schema = new Schema<IPasswordResetRequest>(
  {
    childId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    childName:   { type: String, required: true },
    status:      { type: String, enum: ['pending', 'otp_sent', 'completed', 'expired'], default: 'pending' },
    expiresAt:   { type: Date, required: true },
    otpHash:     { type: String },
    otpExpiry:   { type: Date },
    otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

schema.index({ childId: 1, status: 1 });
schema.index({ parentId: 1, status: 1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPasswordResetRequest>('PasswordResetRequest', schema);
