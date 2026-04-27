import mongoose from "mongoose";
import dotenv from "dotenv";
import PlacementResult from "../src/models/placementResult.model.js";
import PlacementQuestion from "../src/models/placement.model.js";
import { recordMistake } from "../src/services/mistakes.service.js";

dotenv.config();

async function backfill() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected.");

    const results = await PlacementResult.find({});
    console.log(`Found ${results.length} placement results.`);

    let count = 0;
    for (const result of results) {
        for (const answer of result.answers) {
            if (!answer.isCorrect) {
                const q = await PlacementQuestion.findById(answer.questionId);
                if (q) {
                    await recordMistake({
                        childId: result.childId.toString(),
                        questionId: q._id.toString(),
                        questionSource: "placement",
                        questionText: q.questionText,
                        questionType: q.type as any,
                        category: q.category,
                        difficulty: q.difficulty as any,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        childAnswer: answer.selectedAnswer || "",
                    });
                    count++;
                }
            }
        }
    }
    
    console.log(`Backfilled ${count} mistakes from placement tests.`);
    process.exit(0);
}

backfill().catch(console.error);
