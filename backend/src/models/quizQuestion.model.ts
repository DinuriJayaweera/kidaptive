import mongoose, { Document, Schema } from 'mongoose';

export type QuestionType = 'mcq' | 'fill' | 'input' | 'boolean';

export interface IQuizQuestion extends Document {
  questionText: string;
  ageGroup: string;
  category: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctAnswer: string;
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionText: { type: String, required: true },
    ageGroup: { type: String, required: true },
    category: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'fill', 'input', 'boolean'],
      required: true,
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
  },
  { timestamps: true }
);

// Index for test generation queries
quizQuestionSchema.index({ ageGroup: 1, category: 1, difficulty: 1 });

export default mongoose.model<IQuizQuestion>('QuizQuestion', quizQuestionSchema);
