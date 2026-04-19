import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICategoryProgress extends Document {
  childId: Types.ObjectId;
  categoryId: string;
  level: "starter" | "explorer" | "champion";
  xp: number;
  quizzesCompleted: number;
  championWins: number;
  attemptedQuestionIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const categoryProgressSchema = new Schema<ICategoryProgress>(
  {
    childId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: { type: String, required: true },
    level: { type: String, enum: ["starter", "explorer", "champion"], required: true },
    xp: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 },
    championWins: { type: Number, default: 0 },
    attemptedQuestionIds: { type: [Schema.Types.ObjectId], ref: "QuizQuestion", default: [] },
  },
  { timestamps: true }
);

categoryProgressSchema.index({ childId: 1, categoryId: 1 }, { unique: true });

export default mongoose.model<ICategoryProgress>("CategoryProgress", categoryProgressSchema);
