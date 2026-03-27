import mongoose, { Document, Schema } from 'mongoose';

export interface IPlacementQuestion extends Document {
  questionText: string;
  ageGroup: string;
  category: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  createdAt: Date;
  updatedAt: Date;
}

const placementQuestionSchema = new Schema<IPlacementQuestion>(
  {
    questionText: { type: String, required: true },
    ageGroup: { type: String, required: true },
    category: { type: String, required: true },
    questionType: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlacementQuestion>('PlacementQuestion', placementQuestionSchema);
