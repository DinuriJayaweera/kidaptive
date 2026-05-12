import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDailyQuestCompletion extends Document {
  childId: Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  completed: boolean;
  score: number;
  correctCount: number;
  xpEarned: number;
  gemsEarned: number;
  questionIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const dailyQuestCompletionSchema = new Schema<IDailyQuestCompletion>(
  {
    childId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date:         { type: String, required: true },
    completed:    { type: Boolean, default: false },
    score:        { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    xpEarned:     { type: Number, default: 0 },
    gemsEarned:   { type: Number, default: 0 },
    questionIds:  [{ type: Schema.Types.ObjectId, ref: 'DailyQuestQuestion' }],
  },
  { timestamps: true }
);

dailyQuestCompletionSchema.index({ childId: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailyQuestCompletion>(
  'DailyQuestCompletion',
  dailyQuestCompletionSchema
);
