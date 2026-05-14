import { jest } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../../services/notification.service.js", () => ({
    createNotification: async () => {},
}));

import app from "../../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createQuizChild } from "../helpers/testQuiz.js";
import { createVerifiedParent } from "../helpers/testUser.js";
import { signAccessToken } from "../../utils/jwt.js";
import DailyQuestQuestion from "../../models/dailyQuest.model.js";
import DailyQuestCompletion from "../../models/dailyQuestCompletion.model.js";

beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });

async function createChildWithToken(age = 7) {
    const child = await createQuizChild(age);
    const token = signAccessToken({ userId: child._id.toString(), role: "child" });
    return { child, token };
}

async function seedQuestions(ageGroup = "7-8", count = 10) {
    const docs = Array.from({ length: count }, (_, i) => ({
        questionText: `DQ Q${i + 1}`,
        ageGroup,
        category: "General",
        type: "mcq" as const,
        difficulty: "easy" as const,
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
    }));
    return DailyQuestQuestion.insertMany(docs);
}

// ── GET /api/child/daily-quest/today ─────────────────────────────────────────

describe("GET /api/child/daily-quest/today", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/child/daily-quest/today");
        expect(res.status).toBe(401);
    });

    it("returns 403 when parent token used", async () => {
        const parent = await createVerifiedParent();
        const token = signAccessToken({ userId: parent._id.toString(), role: "parent" });
        const res = await request(app)
            .get("/api/child/daily-quest/today")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    it("returns status=available when no quest done today", async () => {
        const { token } = await createChildWithToken();
        const res = await request(app)
            .get("/api/child/daily-quest/today")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("available");
    });

    it("returns status=completed with score after quest done", async () => {
        const { child, token } = await createChildWithToken();
        const today = new Date().toISOString().split("T")[0];
        await DailyQuestCompletion.create({
            childId: child._id,
            date: today,
            completed: true,
            score: 90,
            correctCount: 9,
            xpEarned: 18,
            gemsEarned: 90,
            questionIds: [],
        });

        const res = await request(app)
            .get("/api/child/daily-quest/today")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("completed");
        expect(res.body.completion.score).toBe(90);
    });
});

// ── POST /api/child/daily-quest/start ────────────────────────────────────────

describe("POST /api/child/daily-quest/start", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).post("/api/child/daily-quest/start");
        expect(res.status).toBe(401);
    });

    it("returns questions and correctAnswers map", async () => {
        const { token } = await createChildWithToken(7);
        await seedQuestions("7-8", 10);

        const res = await request(app)
            .post("/api/child/daily-quest/start")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.questions).toBeDefined();
        expect(res.body.questions.length).toBeGreaterThan(0);
        expect(res.body.correctAnswers).toBeDefined();
    });

    it("does not expose correctAnswer inside question objects", async () => {
        const { token } = await createChildWithToken(7);
        await seedQuestions("7-8", 10);

        const res = await request(app)
            .post("/api/child/daily-quest/start")
            .set("Authorization", `Bearer ${token}`);

        for (const q of res.body.questions) {
            expect(q.correctAnswer).toBeUndefined();
        }
    });

    it("returns 409 if quest already completed today", async () => {
        const { child, token } = await createChildWithToken();
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

        const res = await request(app)
            .post("/api/child/daily-quest/start")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(409);
    });
});

// ── POST /api/child/daily-quest/submit ───────────────────────────────────────

describe("POST /api/child/daily-quest/submit", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).post("/api/child/daily-quest/submit").send({ answers: [] });
        expect(res.status).toBe(401);
    });

    it("returns score, xpEarned, gemsEarned for perfect score", async () => {
        const { child, token } = await createChildWithToken(7);
        await seedQuestions("7-8", 10);

        const startRes = await request(app)
            .post("/api/child/daily-quest/start")
            .set("Authorization", `Bearer ${token}`);

        const { questions, correctAnswers } = startRes.body;
        const answers = questions.map((q: any) => ({
            questionId: q._id,
            selectedAnswer: correctAnswers[q._id],
            timeTaken: 3,
        }));

        const res = await request(app)
            .post("/api/child/daily-quest/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers });

        expect(res.status).toBe(200);
        expect(res.body.score).toBe(100);
        expect(res.body.xpEarned).toBe(20);
        expect(res.body.gemsEarned).toBe(150);
        expect(res.body.passed).toBe(true);
    });

    it("returns 409 when submitting after already completed", async () => {
        const { child, token } = await createChildWithToken(7);
        await seedQuestions("7-8", 10);

        const startRes = await request(app)
            .post("/api/child/daily-quest/start")
            .set("Authorization", `Bearer ${token}`);
        const { questions, correctAnswers } = startRes.body;
        const answers = questions.map((q: any) => ({
            questionId: q._id,
            selectedAnswer: correctAnswers[q._id],
            timeTaken: 3,
        }));

        await request(app)
            .post("/api/child/daily-quest/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers });

        const res2 = await request(app)
            .post("/api/child/daily-quest/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers });

        expect(res2.status).toBe(409);
    });
});
