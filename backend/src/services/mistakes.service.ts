import mongoose from "mongoose";
import Mistake from "../models/mistake.model.js";

// ── Record a mistake (upsert — prevents duplicates) ───────────────────────
interface RecordMistakeArgs {
    childId: string;
    questionId: string;
    questionSource: "placement" | "quiz";
    questionText: string;
    questionType: "mcq" | "fill" | "input" | "boolean";
    category: string;
    difficulty: "easy" | "medium" | "hard";
    options: string[];
    correctAnswer: string;
    childAnswer: string;
}

export async function recordMistake(args: RecordMistakeArgs) {
    try {
        await Mistake.findOneAndUpdate(
            {
                childId: new mongoose.Types.ObjectId(args.childId),
                questionId: new mongoose.Types.ObjectId(args.questionId),
            },
            {
                $setOnInsert: {
                    childId: new mongoose.Types.ObjectId(args.childId),
                    questionId: new mongoose.Types.ObjectId(args.questionId),
                    questionSource: args.questionSource,
                    questionText: args.questionText,
                    questionType: args.questionType,
                    category: args.category,
                    difficulty: args.difficulty,
                    options: args.options,
                    correctAnswer: args.correctAnswer,
                    childAnswer: args.childAnswer,
                    resolved: false,
                },
            },
            { upsert: true, new: true }
        );
    } catch (error: any) {
        // Duplicate key is fine — we skip it
        if (error.code === 11000) return;
        console.error("Error recording mistake:", error);
    }
}
