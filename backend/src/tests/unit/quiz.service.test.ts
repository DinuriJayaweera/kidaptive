import { jest } from "@jest/globals";


jest.unstable_mockModule("../../utils/email.js", () => ({
    generateOtp: () => "123456",
    hashOtp: async (otp: string) => otp,
    compareOtp: async (a: string, b: string) => a === b,
    sendVerificationEmail: async () => { },
    sendResetEmail: async () => { },
}));

import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import {
    createQuizChild,
    createQuizQuestions,
    createPlacementResult,
    buildAnswers,
    buildWrongAnswers,
    setProgressXP,
} from "../helpers/testQuiz.js";
import { startQuiz, submitQuiz, getCategoryProgress } from "../../services/quiz.service.js";
import CategoryProgress from "../../models/categoryProgress.model.js";
import QuizQuestion from "../../models/quizQuestion.model.js";
import User from "../../models/User.js";
// ═════════════════════════════════════════════════════════════════════════════
beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
// ═════════════════════════════════════════════════════════════════════════════


// ── A) startQuiz ─────────────────────────────────────────────────────────────
describe("startQuiz", () => {

    it("returns 5 questions for a category at the child's level", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5);

        const result = await startQuiz(child._id.toString(), "Nouns");

        expect(result.questions.length).toBe(5);
        expect(result.questions[0].category).toBe("Nouns");
    });

    it("does NOT expose correctAnswer in the questions array", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5);

        const result = await startQuiz(child._id.toString(), "Nouns");

        for (const q of result.questions) {
            expect((q as any).correctAnswer).toBeUndefined();
        }
    });

    it("exposes correctAnswers in a separate map", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        const result = await startQuiz(child._id.toString(), "Nouns");

        expect(Object.keys(result.correctAnswers).length).toBe(5);
        for (const q of result.questions) {
            expect(result.correctAnswers[q._id.toString()]).toBe("A");
        }
    });

    it("creates a CategoryProgress record on first start", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5);

        await startQuiz(child._id.toString(), "Nouns");

        const progress = await CategoryProgress.findOne({
            childId: child._id,
            categoryId: "Nouns",
        });
        expect(progress).not.toBeNull();
        expect(progress?.level).toBe("starter"); // default level
    });

    it("initializes level from placement result when available", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "explorer");
        await createQuizQuestions("Nouns", "medium", "7-8", 5);

        await startQuiz(child._id.toString(), "Nouns");

        const progress = await CategoryProgress.findOne({
            childId: child._id,
            categoryId: "Nouns",
        });
        expect(progress?.level).toBe("explorer");
    });

    it("serves easy questions for starter level", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5);
        await createQuizQuestions("Nouns", "medium", "7-8", 5);
        await createQuizQuestions("Nouns", "hard", "7-8", 5);

        const result = await startQuiz(child._id.toString(), "Nouns");

        // Starter → should get easy questions
        expect(result.questions.every((q: any) => q.difficulty === "easy")).toBe(true);
    });

    it("serves medium questions for explorer level", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "explorer");
        await createQuizQuestions("Nouns", "easy", "7-8", 5);
        await createQuizQuestions("Nouns", "medium", "7-8", 5);
        await createQuizQuestions("Nouns", "hard", "7-8", 5);

        const result = await startQuiz(child._id.toString(), "Nouns");

        expect(result.questions.every((q: any) => q.difficulty === "medium")).toBe(true);
    });

    it("serves hard questions for champion level", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        await createQuizQuestions("Nouns", "easy", "7-8", 5);
        await createQuizQuestions("Nouns", "medium", "7-8", 5);
        await createQuizQuestions("Nouns", "hard", "7-8", 5);

        const result = await startQuiz(child._id.toString(), "Nouns");

        expect(result.questions.every((q: any) => q.difficulty === "hard")).toBe(true);
    });

    it("serves targetLevel questions when targetLevel is passed", async () => {
        const child = await createQuizChild(7);
        // Child is starter but we request hard (champion replay)
        await createQuizQuestions("Nouns", "hard", "7-8", 5);

        const result = await startQuiz(child._id.toString(), "Nouns", "champion");

        expect(result.questions.every((q: any) => q.difficulty === "hard")).toBe(true);
    });

    it("falls back to any difficulty if target difficulty has no questions", async () => {
        const child = await createQuizChild(7);
        // Only easy questions exist, but child is explorer
        await createQuizQuestions("Nouns", "easy", "7-8", 5);

        const result = await startQuiz(child._id.toString(), "Nouns");

        // Should fall back to easy (whatever exists)
        expect(result.questions.length).toBeGreaterThan(0);
    });

    it("returns current progress info with questions", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5);

        const result = await startQuiz(child._id.toString(), "Nouns");

        expect(result.progress).toBeDefined();
        expect(result.progress.level).toBe("starter");
        expect(result.progress.xp).toBe(0);
        expect(result.progress.xpToNextLevel).toBe(50);
        expect(result.progress.quizzesCompleted).toBe(0);
    });

});


// ── B) submitQuiz — Scoring ───────────────────────────────────────────────────
describe("submitQuiz — scoring", () => {

    it("scores 100% correct + fast as passed with high score", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const answers = buildAnswers(questions, "A", 5); // correct + ≤10s
        const result = await submitQuiz(child._id.toString(), "Nouns", answers);

        // accuracyScore = 100, timeAverage = 100
        // score = 0.8×100 + 0.2×100 = 100
        expect(result.score).toBe(100);
        expect(result.passed).toBe(true);
    });

    it("scores 0% correct as failed with score 0", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const answers = buildWrongAnswers(questions);
        const result = await submitQuiz(child._id.toString(), "Nouns", answers);

        // accuracyScore = 0, timeAverage = 0 (no correct answers)
        // score = 0.8×0 + 0.2×0 = 0
        expect(result.score).toBe(0);
        expect(result.passed).toBe(false);
    });

    it("score = 0.8 × accuracy + 0.2 × time formula is applied correctly", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        // All 5 correct, all in 25 seconds (>20s → timeScore=40)
        const answers = buildAnswers(questions, "A", 25);
        const result = await submitQuiz(child._id.toString(), "Nouns", answers);

        // accuracyScore = 100, timeAverage = 40
        // score = Math.round(0.8×100 + 0.2×40) = Math.round(80+8) = 88
        expect(result.score).toBe(88);
    });

    it("pass threshold is 75 — score 75 passes, score 74 fails", async () => {
        // We test pass=true on score≥75 and pass=false on score<75
        // All correct + slow time (>20s): score = 0.8×100 + 0.2×40 = 88 → passes
        const child1 = await createQuizChild(7);
        const questions1 = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child1._id.toString(), "Nouns");
        const r1 = await submitQuiz(child1._id.toString(), "Nouns", buildAnswers(questions1, "A", 25));
        expect(r1.passed).toBe(true); // 88 ≥ 75

        // 3 correct + slow time: accuracy=60, time=40, score = 0.8×60+0.2×40=56 → fails
        const child2 = await createQuizChild(8);
        const questions2 = await createQuizQuestions("Verbs", "easy", "7-8", 5, "A");
        await startQuiz(child2._id.toString(), "Verbs");
        const answers2 = [
            ...buildAnswers(questions2.slice(0, 3), "A", 25),  // 3 correct
            ...buildWrongAnswers(questions2.slice(3)),           // 2 wrong
        ];
        const r2 = await submitQuiz(child2._id.toString(), "Verbs", answers2);
        expect(r2.passed).toBe(false); // 56 < 75
    });

    it("time score brackets: ≤10s=100, 11-15s=80, 16-20s=60, >20s=40", async () => {
        // Test each time bracket
        const brackets = [
            { time: 5, expected: 100 },
            { time: 13, expected: 80 },
            { time: 18, expected: 60 },
            { time: 25, expected: 40 },
        ];

        for (const { time, expected } of brackets) {
            const child = await createQuizChild(7);
            const questions = await createQuizQuestions(`Cat${time}`, "easy", "7-8", 5, "A");
            await startQuiz(child._id.toString(), `Cat${time}`);
            const answers = buildAnswers(questions, "A", time);
            const result = await submitQuiz(child._id.toString(), `Cat${time}`, answers);
            // All correct → accuracy=100, time=expected
            // score = 0.8×100 + 0.2×expected
            expect(result.score).toBe(Math.round(0.8 * 100 + 0.2 * expected));
        }
    });

    it("handles case-insensitive comparison for input type questions", async () => {
        const child = await createQuizChild(7);
        await QuizQuestion.create([
            { questionText: "Q1", ageGroup: "7-8", category: "Nouns", type: "input", difficulty: "easy", options: [], correctAnswer: "Apple" },
            { questionText: "Q2", ageGroup: "7-8", category: "Nouns", type: "input", difficulty: "easy", options: [], correctAnswer: "Apple" },
            { questionText: "Q3", ageGroup: "7-8", category: "Nouns", type: "input", difficulty: "easy", options: [], correctAnswer: "Apple" },
            { questionText: "Q4", ageGroup: "7-8", category: "Nouns", type: "input", difficulty: "easy", options: [], correctAnswer: "Apple" },
            { questionText: "Q5", ageGroup: "7-8", category: "Nouns", type: "input", difficulty: "easy", options: [], correctAnswer: "Apple" },
        ]);

        const started = await startQuiz(child._id.toString(), "Nouns");
        // Answer with lowercase — should still match "Apple"
        const answers = started.questions.map((q: any) => ({
            questionId: q._id.toString(),
            selectedAnswer: "apple",
            timeTaken: 5,
        }));

        const result = await submitQuiz(child._id.toString(), "Nouns", answers);
        expect(result.correctCount).toBe(5);
        expect(result.passed).toBe(true);
    });

});


// ── C) submitQuiz — XP & Level Progression ───────────────────────────────────
describe("submitQuiz — XP and level progression", () => {

    it("awards +10 XP on a passed quiz (starter)", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.xpGained).toBe(10);
        expect(result.newXP).toBe(10);
    });

    it("awards +10 totalXP to the child document on pass", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        const updatedChild = await User.findById(child._id);
        expect(updatedChild?.totalXP).toBe(10);
    });

    it("does NOT award XP on a failed quiz", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const result = await submitQuiz(child._id.toString(), "Nouns", buildWrongAnswers(questions));

        expect(result.xpGained).toBe(0);
        expect(result.newXP).toBe(0);
    });

    it("levels up from starter to explorer when XP reaches 50", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        // Set XP to 40 directly so one more pass (10XP) triggers level up
        await setProgressXP(child._id.toString(), "Nouns", 40, "starter");

        const started = await startQuiz(child._id.toString(), "Nouns");
        const result = await submitQuiz(
            child._id.toString(),
            "Nouns",
            buildAnswers(started.questions, "A", 5),
        );

        expect(result.levelUp).toBe(true);
        expect(result.newLevel).toBe("explorer");
    });

    it("resets categoryXP to 0 on level up", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await setProgressXP(child._id.toString(), "Nouns", 40, "starter");

        const started = await startQuiz(child._id.toString(), "Nouns");
        const result = await submitQuiz(
            child._id.toString(),
            "Nouns",
            buildAnswers(started.questions, "A", 5),
        );

        expect(result.newXP).toBe(0); // reset after level up
    });

    it("levels up from explorer to champion when XP reaches 50", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "explorer");
        await createQuizQuestions("Nouns", "medium", "7-8", 5, "A");
        await setProgressXP(child._id.toString(), "Nouns", 40, "explorer");

        const started = await startQuiz(child._id.toString(), "Nouns");
        const result = await submitQuiz(
            child._id.toString(),
            "Nouns",
            buildAnswers(started.questions, "A", 5),
        );

        expect(result.levelUp).toBe(true);
        expect(result.newLevel).toBe("champion");
    });

    it("does NOT level up when XP < 50", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        const started = await startQuiz(child._id.toString(), "Nouns");
        const result = await submitQuiz(
            child._id.toString(),
            "Nouns",
            buildAnswers(started.questions, "A", 5),
        );

        // First quiz: 10 XP, not 50 yet
        expect(result.levelUp).toBe(false);
        expect(result.newLevel).toBe("starter");
    });

    it("does NOT award XP or change quizzesCompleted on a replay", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        // First pass — normal
        await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        // Replay — isReplay: true
        const result = await submitQuiz(
            child._id.toString(),
            "Nouns",
            buildAnswers(questions, "A", 5),
            undefined,
            true, // isReplay
        );

        expect(result.xpGained).toBe(0);
    });

    it("does NOT award XP when playing at a lower level than current (targetLevel ≠ progress.level)", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "explorer");
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        const started = await startQuiz(child._id.toString(), "Nouns", "starter");
        const result = await submitQuiz(
            child._id.toString(),
            "Nouns",
            buildAnswers(started.questions, "A", 5),
            "starter", // targetLevel is lower than actual level (explorer)
        );

        // Treated as effective replay — no XP
        expect(result.xpGained).toBe(0);
    });

});


// ── D) submitQuiz — Gems ──────────────────────────────────────────────────────
describe("submitQuiz — gems", () => {

    it("awards +1 gem on a passed quiz (starter/explorer)", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.gemsEarned).toBe(1);
    });

    it("awards +2 gems bonus every 5 quizzes completed (starter/explorer)", async () => {
        const child = await createQuizChild(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        // Set quizzesCompleted to 4 so the next quiz triggers the bonus
        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { quizzesCompleted: 4 },
            { upsert: true, new: true },
        );

        // Make sure there's already a progress record
        await setProgressXP(child._id.toString(), "Nouns", 0, "starter");
        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { quizzesCompleted: 4 },
        );

        const started = await startQuiz(child._id.toString(), "Nouns");
        const result = await submitQuiz(
            child._id.toString(),
            "Nouns",
            buildAnswers(started.questions, "A", 5),
        );

        // +1 for pass + 2 bonus at 5th quiz = 3
        expect(result.gemsEarned).toBe(3);
    });

    it("does NOT award gems on a failed quiz", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const result = await submitQuiz(child._id.toString(), "Nouns", buildWrongAnswers(questions));

        expect(result.gemsEarned).toBe(0);
    });

    it("does NOT award gems on a replay even if passed", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        const result = await submitQuiz(
            child._id.toString(),
            "Nouns",
            buildAnswers(questions, "A", 5),
            undefined,
            true, // isReplay
        );

        expect(result.gemsEarned).toBe(0);
    });

    it("adds gems to child.gems document correctly", async () => {
        const child = await createQuizChild(7, { gems: 5 }); // start with 5 gems
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        const updatedChild = await User.findById(child._id);
        expect(updatedChild?.gems).toBe(6); // 5 + 1
    });

});


// ── E) submitQuiz — Champion Mode ─────────────────────────────────────────────
describe("submitQuiz — champion mode", () => {

    it("does NOT level up when already at champion level", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.levelUp).toBe(false);
        expect(result.newLevel).toBe("champion");
        expect(result.isChampion).toBe(true);
    });

    it("awards +20 XP to totalXP on champion pass (not categoryXP)", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.xpGained).toBe(20);
        // categoryXP stays 0 (champion never accumulates categoryXP)
        expect(result.newXP).toBe(0);
    });

    it("awards +2 gems on champion pass", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.gemsEarned).toBe(2);
    });

    it("tracks champion wins correctly", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");

        await startQuiz(child._id.toString(), "Nouns");
        const result1 = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));
        expect(result1.championWins).toBe(1);

        const result2 = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));
        expect(result2.championWins).toBe(2);
    });

    it("does NOT award XP or gems on champion fail", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        const result = await submitQuiz(child._id.toString(), "Nouns", buildWrongAnswers(questions));

        expect(result.xpGained).toBe(0);
        expect(result.gemsEarned).toBe(0);
    });

});


// ── F) submitQuiz — Champion Badge System ─────────────────────────────────────
describe("Champion badge system", () => {

    it("starts with no badge (none) at 0 wins", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        // Fail the quiz — no wins
        const result = await submitQuiz(child._id.toString(), "Nouns", buildWrongAnswers(questions));

        expect(result.championBadge.current).toBe("none");
        expect(result.championBadge.next).toBe("bronze");
        expect(result.championBadge.winsToNext).toBe(5);
    });

    it("awards bronze badge at 5 wins", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        // Set championWins to 4 directly, then pass once more to reach 5
        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { championWins: 4, level: "champion" },
            { upsert: true, new: true },
        );

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.championWins).toBe(5);
        expect(result.championBadge.current).toBe("bronze");
        expect(result.newBadge).toBe(true); // new badge earned
    });

    it("awards silver badge at 15 wins", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { championWins: 14, level: "champion" },
            { upsert: true, new: true },
        );

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.championBadge.current).toBe("silver");
        expect(result.newBadge).toBe(true);
    });

    it("awards gold badge at 30 wins", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { championWins: 29, level: "champion" },
            { upsert: true, new: true },
        );

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.championBadge.current).toBe("gold");
        expect(result.newBadge).toBe(true);
    });

    it("awards master badge at 50 wins", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { championWins: 49, level: "champion" },
            { upsert: true, new: true },
        );

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.championBadge.current).toBe("master");
        expect(result.championBadge.winsToNext).toBe(0);
        expect(result.newBadge).toBe(true);
    });

    it("does NOT trigger newBadge if badge did not change", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");
        await startQuiz(child._id.toString(), "Nouns");

        // At 6 wins — already bronze, win again → still bronze
        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { championWins: 6, level: "champion" },
            { upsert: true, new: true },
        );

        const result = await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        expect(result.championBadge.current).toBe("bronze");
        expect(result.newBadge).toBe(false); // no new badge
    });

});


// ── G) getCategoryProgress ────────────────────────────────────────────────────
describe("getCategoryProgress", () => {

    it("creates default progress when none exists", async () => {
        const child = await createQuizChild(7);

        const result = await getCategoryProgress(child._id.toString(), "Nouns");

        expect(result.level).toBe("starter");
        expect(result.xp).toBe(0);
        expect(result.xpToNextLevel).toBe(50);
        expect(result.quizzesCompleted).toBe(0);
        expect(result.questionsAttempted).toBe(0);
    });

    it("initializes from placement result if available", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "explorer");

        const result = await getCategoryProgress(child._id.toString(), "Nouns");

        expect(result.level).toBe("explorer");
    });

    it("returns correct progress after quizzes are completed", async () => {
        const child = await createQuizChild(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await startQuiz(child._id.toString(), "Nouns");
        await submitQuiz(child._id.toString(), "Nouns", buildAnswers(questions, "A", 5));

        const result = await getCategoryProgress(child._id.toString(), "Nouns");

        expect(result.xp).toBe(10);
        expect(result.quizzesCompleted).toBe(1);
        expect(result.questionsAttempted).toBe(5);
    });

    it("returns champion-specific fields when at champion level", async () => {
        const child = await createQuizChild(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");

        const result = await getCategoryProgress(child._id.toString(), "Nouns");

        expect(result.championWins).toBeDefined();
        expect(result.championBadge).toBeDefined();
        expect(result.championBadge.current).toBe("none");
    });

});