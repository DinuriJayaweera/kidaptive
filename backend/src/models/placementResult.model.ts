import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPlacementAnswer {
  questionId: Types.ObjectId;
  categoryId: string;
  difficulty: "easy" | "medium" | "hard";
  selectedAnswer: string;
  isCorrect: boolean;
  timeTaken: number; // seconds
}

export interface ICategoryResult {
  categoryId: string;
  score: number; // 0-100
  level: "starter" | "explorer" | "champion";
}

export interface IPlacementResult extends Document {
  childId: Types.ObjectId;
  ageGroup: string;
  evaluatedCategories: string[];
  categoryResults: ICategoryResult[];
  answers: IPlacementAnswer[];
  placementCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const placementAnswerSchema = new Schema<IPlacementAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "PlacementQuestion", required: true },
    categoryId: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    selectedAnswer: { type: String, default: "" },
    isCorrect: { type: Boolean, required: true },
    timeTaken: { type: Number, required: true },
  },
  { _id: false }
);

const categoryResultSchema = new Schema<ICategoryResult>(
  {
    categoryId: { type: String, required: true },
    score: { type: Number, required: true },
    level: { type: String, enum: ["starter", "explorer", "champion"], required: true },
  },
  { _id: false }
);

const placementResultSchema = new Schema<IPlacementResult>(
  {
    childId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    ageGroup: { type: String, required: true },
    evaluatedCategories: { type: [String], default: [] },
    categoryResults: { type: [categoryResultSchema], default: [] },
    answers: { type: [placementAnswerSchema], default: [] },
    placementCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IPlacementResult>("PlacementResult", placementResultSchema);
