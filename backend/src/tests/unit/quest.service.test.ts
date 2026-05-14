import { jest, describe, it, expect, beforeAll, afterEach, afterAll } from "@jest/globals";

jest.unstable_mockModule("../../services/notification.service.js", () => ({
    createNotification: async () => {},
}));

import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createQuizChild } from "../helpers/testQuiz.js";
import DailyQuestQuestion from "../../models/dailyQuest.model.js";
import DailyQuestCompletion from "../../models/dailyQuestCompletion.model.js";
import User from "../../models/User.js";
import { getTodayStatus, startDailyQuest, submitDailyQuest } from "../../services/childDailyQuest.service.js";

beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });

async function seedQuestions(ageGroup = "7-8", count = 10) {
    const docs = Array.from({ length: count }, (_, i) => ({
        questionText: `Daily Q${i + 1}`,
        ageGroup,
        category: "General",
        type: "mcq" as const,
        difficulty: "easy" as const,
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
    }));
    return DailyQuestQuestion.insertMany(docs);
}

// ── getTodayStatus ────────────────────────────────────────────────────────────

describe("getTodayStatus", () => {

    it("returns 'available' when no completion record exists", async () => {
        const child = await createQuizChild(7);
        const result = await getTodayStatus(child._id.toString());
        expect(result.status).toBe("available");
    });

    it("returns 'completed' with score data after quest is done", async () => {
        const child = await createQuizChild(7);
        const today = new Date().toISOString().split("T")[0];
        await DailyQuestCompletion.create({
            childId: child._id,
            date: today,
            completed: true,
            score: 80,
            correctCount: 8,
            xpEarned: 16,
            gemsEarned: 80,
            questionIds: [],
        });

        const result = await getTodayStatus(child._id.toString());
        expect(result.status).toBe("completed");
        expect(result.completion?.score).toBe(80);
        expect(result.completion?.xpEarned).toBe(16);
        expect(result.completion?.gemsEarned).toBe(80);
    });
});

// ── startDailyQuest ───────────────────────────────────────────────────────────

describe("startDailyQuest", () => {

    it("returns questions and correctAnswers map", async () => {
        const child = await createQuizChild(7);
        await seedQuestions("7-8", 10);

        const result = await startDailyQuest(child._id.toString());

        expect(result.questions.length).toBeGreaterThan(0);
        expect(result.correctAnswers).toBeDefined();
        expect(Object.keys(result.correctAnswers).length).toBe(result.questions.length);
    });

    it("does not expose correctAnswer in question objects", async () => {
        const child = await createQuizChild(7);
        await seedQuestions("7-8", 10);

        const result = await startDailyQuest(child._id.toString());

        for (const q of result.questions) {
            expect((q as any).correctAnswer).toBeUndefined();
        }
    });

    it("throws if quest is already completed today", async () => {
        const child = await createQuizChild(7);
        const today = new Date().toISOString().split("T")[0];
        await DailyQuestCompletion.create({
            childId: child._id,
            date: today,
            completed: true,
            score: 100,
            correctCount: 10,
            xpEarned: 20,
            gemsEarned: 150,
            questionIds: [],
        });

        await expect(startDailyQuest(child._id.toString())).rejects.toThrow(
            "Daily quest already completed today."
        );
    });

    it("throws when no questions are available for the age group", async () => {
        const child = await createQuizChild(7);

        await expect(startDailyQuest(child._id.toString())).rejects.toThrow(
            "No daily quest questions available for your age group."
        );
    });
});

// ── submitDailyQuest ──────────────────────────────────────────────────────────

describe("submitDailyQuest", () => {

    async function setupAndStart(age = 7) {
        const child = await createQuizChild(age);
        await seedQuestions(`${age}-${age + 1}`, 10);
        const { questions, correctAnswers } = await startDailyQuest(child._id.toString());
        return { child, questions, correctAnswers };
    }

    it("returns score=100 when all 10 answers are correct", async () => {
        const { child, questions, correctAnswers } = await setupAndStart();
        const answers = questions.map((q: any) => ({
            questionId: q._id.toString(),
            selectedAnswer: correctAnswers[q._id.toString()],
            timeTaken: 3,
        }));

        const result = await submitDailyQuest(child._id.toString(), answers);

        expect(result.score).toBe(100);
        expect(result.correctCount).toBe(10);
        expect(result.passed).toBe(true);
    });

    it("awards max 20 XP on perfect score", async () => {
        const { child, questions, correctAnswers } = await setupAndStart();
        const answers = questions.map((q: any) => ({
            questionId: q._id.toString(),
            selectedAnswer: correctAnswers[q._id.toString()],
            timeTaken: 3,
        }));

        const result = await submitDailyQuest(child._id.toString(), answers);

        expect(result.xpEarned).toBe(20);
    });

    it("awards 150 gems (100 + 50 bonus) on perfect score", async () => {
        const { child, questions, correctAnswers } = await setupAndStart();
        const answers = questions.map((q: any) => ({
            questionId: q._id.toString(),
            selectedAnswer: correctAnswers[q._id.toString()],
            timeTaken: 3,
        }));

        const result = await submitDailyQuest(child._id.toString(), answers);

        expect(result.gemsEarned).toBe(150);
    });

    it("calculates XP and gems correctly for 8/10 (score=80)", async () => {
        const { child, questions, correctAnswers } = await setupAndStart();
        const answers = questions.map((q: any, i: number) => ({
            questionId: q._id.toString(),
            selectedAnswer: i < 8 ? correctAnswers[q._id.toString()] : "WRONG",
            timeTaken: 3,
        }));

        const result = await submitDailyQuest(child._id.toString(), answers);

        expect(result.score).toBe(80);
        expect(result.xpEarned).toBe(16);
        expect(result.gemsEarned).toBe(80);
        expect(result.passed).toBe(true);
    });

    it("fails (passed=false) when score < 75", async () => {
        const { child, questions, correctAnswers } = await setupAndStart();
        const answers = questions.map((q: any, i: number) => ({
            questionId: q._id.toString(),
            selectedAnswer: i < 7 ? correctAnswers[q._id.toString()] : "WRONG",
            timeTaken: 3,
        }));

        const result = await submitDailyQuest(child._id.toString(), answers);

        expect(result.score).toBe(70);
        expect(result.passed).toBe(false);
    });

    it("updates child totalXP and gems in the database", async () => {
        const { child, questions, correctAnswers } = await setupAndStart();
        const answers = questions.map((q: any) => ({
            questionId: q._id.toString(),
            selectedAnswer: correctAnswers[q._id.toString()],
            timeTaken: 3,
        }));

        await submitDailyQuest(child._id.toString(), answers);

        const updated = await User.findById(child._id);
        expect(updated!.totalXP).toBe(20);
        expect(updated!.gems).toBe(150);
    });

    it("creates a DailyQuestCompletion record", async () => {
        const { child, questions, correctAnswers } = await setupAndStart();
        const answers = questions.map((q: any) => ({
            questionId: q._id.toString(),
            selectedAnswer: correctAnswers[q._id.toString()],
            timeTaken: 3,
        }));

        await submitDailyQuest(child._id.toString(), answers);

        const today = new Date().toISOString().split("T")[0];
        const record = await DailyQuestCompletion.findOne({ childId: child._id, date: today });
        expect(record).not.toBeNull();
        expect(record!.completed).toBe(true);
    });

    it("throws if attempting to submit again after completion", async () => {
        const { child, questions, correctAnswers } = await setupAndStart();
        const answers = questions.map((q: any) => ({
            questionId: q._id.toString(),
            selectedAnswer: correctAnswers[q._id.toString()],
            timeTaken: 3,
        }));

        await submitDailyQuest(child._id.toString(), answers);

        await expect(submitDailyQuest(child._id.toString(), answers)).rejects.toThrow(
            "Daily quest already completed today."
        );
    });
});
