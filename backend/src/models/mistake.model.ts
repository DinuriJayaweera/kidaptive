import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMistake extends Document {
    childId: Types.ObjectId;
    questionId: Types.ObjectId;
    questionSource: "placement" | "quiz";       // which system generated this mistake
    questionText: string;
    questionType: "mcq" | "fill" | "input" | "boolean";
    category: string;
    difficulty: "easy" | "medium" | "hard";
    options: string[];
    correctAnswer: string;
    childAnswer: string;                         // what the child picked
    resolved: boolean;                           // true once the child answers it correctly
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const mistakeSchema = new Schema<IMistake>(
    {
        childId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        questionId: { type: Schema.Types.ObjectId, required: true },
        questionSource: { type: String, enum: ["placement", "quiz"], required: true },
        questionText: { type: String, required: true },
        questionType: { type: String, enum: ["mcq", "fill", "input", "boolean"], required: true },
        category: { type: String, required: true },
        difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
        options: { type: [String], default: [] },
        correctAnswer: { type: String, required: true },
        childAnswer: { type: String, default: "" },
        resolved: { type: Boolean, default: false },
        resolvedAt: { type: Date },
    },
    { timestamps: true }
);

// One mistake per child per question (prevents duplicates)
mistakeSchema.index({ childId: 1, questionId: 1 }, { unique: true });
// Fast lookup for unresolved pool
mistakeSchema.index({ childId: 1, resolved: 1 });

export default mongoose.model<IMistake>("Mistake", mistakeSchema);
