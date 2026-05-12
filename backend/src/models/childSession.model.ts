import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChildSession extends Document {
  childId: Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  sessionStart: Date;
  lastHeartbeat: Date;
  createdAt: Date;
  updatedAt: Date;
}

const childSessionSchema = new Schema<IChildSession>(
  {
    childId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date:          { type: String, required: true },
    sessionStart:  { type: Date, required: true },
    lastHeartbeat: { type: Date, required: true },
  },
  { timestamps: true },
);

childSessionSchema.index({ childId: 1, date: 1 });

export default mongoose.model<IChildSession>('ChildSession', childSessionSchema);
