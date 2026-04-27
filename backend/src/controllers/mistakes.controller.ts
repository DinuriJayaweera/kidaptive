import { Request, Response } from "express";
import Mistake from "../models/mistake.model.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import type { TokenPayload } from "../utils/jwt.js";

type AuthRequest = Request & { user: TokenPayload };

// XP rewards by difficulty (smaller than real quizzes)
const MISTAKE_XP: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
};

// ── GET /child/mistakes — fetch unresolved mistake pool ────────────────────
export const getMistakes = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthRequest).user;

        const mistakes = await Mistake.find({ childId: userId, resolved: false })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            count: mistakes.length,
            mistakes: mistakes.map((m) => ({
                _id: m._id.toString(),
                questionId: m.questionId.toString(),
                questionText: m.questionText,
                questionType: m.questionType,
                category: m.category,
                difficulty: m.difficulty,
                options: m.options,
                correctAnswer: m.correctAnswer,
                childAnswer: m.childAnswer,
                questionSource: m.questionSource,
            })),
        });
    } catch (error) {
        console.error("Error in getMistakes:", error);
        res.status(500).json({ message: "Failed to load mistakes." });
    }
};

// ── POST /child/mistakes/start — start a mistakes practice session ─────────
// Returns up to 5 random unresolved mistakes for the child
export const startMistakeSession = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthRequest).user;

        const childObjectId = new mongoose.Types.ObjectId(userId);
        
        const totalMistakes = await Mistake.countDocuments({ childId: childObjectId, resolved: false });

        const mistakes = await Mistake.aggregate([
            { $match: { childId: childObjectId, resolved: false } },
            { $sample: { size: 5 } },
        ]);

        if (mistakes.length === 0) {
            return res.json({ questions: [], message: "No mistakes to practice!" });
        }

        // Build answer map (hidden from client in real usage, but needed for checking)
        const correctAnswers: Record<string, string> = {};
        const questions = mistakes.map((m: any) => {
            correctAnswers[m._id.toString()] = m.correctAnswer;
            return {
                _id: m._id.toString(),
                questionId: m.questionId.toString(),
                questionText: m.questionText,
                type: m.questionType,
                category: m.category,
                difficulty: m.difficulty,
                options: m.options,
            };
        });

        return res.json({ questions, correctAnswers, totalMistakes });
    } catch (error) {
        console.error("Error in startMistakeSession:", error);
        res.status(500).json({ message: "Failed to start mistake session." });
    }
};

// ── POST /child/mistakes/submit — submit answers for a mistakes session ────
export const submitMistakeSession = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthRequest).user;
        const { answers } = req.body;
        // answers: [{ mistakeId, selectedAnswer }]

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: "answers array required." });
        }

        const child = await User.findById(userId);
        if (!child) return res.status(404).json({ message: "Child not found." });

        let totalXpGained = 0;
        let fixedCount = 0;
        let totalCount = answers.length;
        let gemsEarned = 0;
        const results: { mistakeId: string; correct: boolean; xpGained: number; correctAnswer: string }[] = [];

        for (const answer of answers) {
            const mistake = await Mistake.findOne({ _id: answer.mistakeId, childId: userId });
            if (!mistake) continue;

            // Check correctness
            let isCorrect = false;
            if (mistake.questionType === "input") {
                isCorrect = (answer.selectedAnswer || "").trim().toLowerCase() === mistake.correctAnswer.trim().toLowerCase();
            } else {
                isCorrect = answer.selectedAnswer === mistake.correctAnswer;
            }

            let xpGained = 0;

            if (isCorrect) {
                // Mark as resolved — it disappears from active pool
                mistake.resolved = true;
                mistake.resolvedAt = new Date();
                await mistake.save();

                // Award reduced XP
                xpGained = MISTAKE_XP[mistake.difficulty] || 2;
                child.totalXP = (child.totalXP || 0) + xpGained;
                totalXpGained += xpGained;
                fixedCount++;
            }

            results.push({
                mistakeId: mistake._id.toString(),
                correct: isCorrect,
                xpGained,
                correctAnswer: mistake.correctAnswer,
            });
        }

        // Gem bonus: award 1 gem if child fixed 3+ mistakes in one session
        if (fixedCount >= 3) {
            gemsEarned = 1;
            child.gems = (child.gems || 0) + 1;
        }

        await child.save();

        const remainingMistakes = await Mistake.countDocuments({ childId: userId, resolved: false });

        return res.json({
            fixedCount,
            totalCount,
            totalXpGained,
            gemsEarned,
            totalXP: child.totalXP,
            totalGems: child.gems,
            remainingMistakes,
            results,
        });
    } catch (error: any) {
        console.error("Error in submitMistakeSession:", error);
        import("fs").then(fs => fs.appendFileSync("submit-error.log", error.stack + "\n\n"));
        res.status(500).json({ message: "Failed to submit mistake session." });
    }
};
