import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICategoryProgress extends Document {
  childId: Types.ObjectId;
  categoryId: string;
  level: "starter" | "explorer" | "champion";
  xp: number;
  quizzesCompleted: number;
  globalQuizzesCompleted: number;
  championWins: number;
  attemptedQuestionIds: Types.ObjectId[];
  /**
   * Levels the child *earned* via quiz progression on this category.
   *
   * The placement test sets `level` to wherever the child placed, but
   * "earning" a level means levelling up INTO it through gameplay.
   *
   * Example: child placed at Explorer → `level: "explorer"`,
   * `earnedLevels: []`. Then they pass enough Explorer quizzes to
   * level up to Champion → `level: "champion"`,
   * `earnedLevels: ["champion"]`.
   *
   * Achievement rules:
   *   - Explorer Crown unlocks when ANY category has "explorer" in earnedLevels
   *   - Champion Crown unlocks when ANY category has "champion" in earnedLevels
   *   - Starter Crown is granted on placement (everyone starts here)
   *
   * This field is appended to in `quiz.service.ts → submitQuiz` whenever
   * `levelUp = true`. Backfill script can also seed it from championWins.
   */
  earnedLevels: ("explorer" | "champion")[];
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
    globalQuizzesCompleted: { type: Number, default: 0 },
    championWins: { type: Number, default: 0 },
    attemptedQuestionIds: { type: [Schema.Types.ObjectId], ref: "QuizQuestion", default: [] },
    earnedLevels: {
      type: [String],
      enum: ["explorer", "champion"],
      default: [],
    },
  },
  { timestamps: true }
);

categoryProgressSchema.index({ childId: 1, categoryId: 1 }, { unique: true });

export default mongoose.model<ICategoryProgress>("CategoryProgress", categoryProgressSchema);
