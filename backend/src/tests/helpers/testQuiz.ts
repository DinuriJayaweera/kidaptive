import mongoose from "mongoose";
import User from "../../models/User.js";
import QuizQuestion from "../../models/quizQuestion.model.js";
import CategoryProgress from "../../models/categoryProgress.model.js";
import PlacementResult from "../../models/placementResult.model.js";

// ── Create a child user for quiz testing ──────────────────────────────────────
export async function createQuizChild(age: number = 7, overrides: any = {}) {
    return User.create({
        name: "Quiz Child",
        email: `quizchild-${Date.now()}@child.kidaptive.local`,
        username: `quizchild${Date.now()}`,
        password: "dummy",
        role: "child",
        age,
        emailVerified: true,
        tokenVersion: 0,
        loginMethod: "pin",
        parentId: new mongoose.Types.ObjectId(),
        totalXP: 0,
        gems: 0,
        streak: 0,
        ...overrides,
    });
}

// ── Create quiz questions for a category ─────────────────────────────────────
// Creates 5 questions of a given difficulty (all with known correct answer "A")
export async function createQuizQuestions(
    category: string,
    difficulty: "easy" | "medium" | "hard",
    ageGroup: string = "7-8",
    count: number = 5,
    correctAnswer: string = "A",
) {
    const questions = Array.from({ length: count }, (_, i) => ({
        questionText: `${difficulty} Q${i + 1} about ${category}`,
        ageGroup,
        category,
        type: "mcq" as const,
        difficulty,
        options: ["A", "B", "C", "D"],
        correctAnswer,
    }));
    return QuizQuestion.insertMany(questions);
}

// ── Create a placement result so child has an initial level ──────────────────
export async function createPlacementResult(
    childId: string,
    categoryId: string,
    level: "starter" | "explorer" | "champion",
) {
    return PlacementResult.create({
        childId,
        ageGroup: "7-8",
        categoryResults: [{ categoryId, level, score: level === "starter" ? 30 : level === "explorer" ? 65 : 90 }],
        evaluatedCategories: [categoryId],
        placementCompleted: true,
    });
}

// ── Build an answers array (all correct, given timeTaken) ────────────────────
export function buildAnswers(
    questions: any[],
    correctAnswer: string = "A",
    timeTaken: number = 5,
) {
    return questions.map((q) => ({
        questionId: q._id.toString(),
        selectedAnswer: correctAnswer,
        timeTaken,
    }));
}

// ── Build an answers array (all wrong) ───────────────────────────────────────
export function buildWrongAnswers(questions: any[], timeTaken: number = 30) {
    return questions.map((q) => ({
        questionId: q._id.toString(),
        selectedAnswer: "WRONG_ANSWER",
        timeTaken,
    }));
}

// ── Set XP on a child's category progress directly ───────────────────────────
export async function setProgressXP(
    childId: string,
    categoryId: string,
    xp: number,
    level: "starter" | "explorer" | "champion" = "starter",
) {
    return CategoryProgress.findOneAndUpdate(
        { childId, categoryId },
        { xp, level },
        { upsert: true, new: true },
    );
}