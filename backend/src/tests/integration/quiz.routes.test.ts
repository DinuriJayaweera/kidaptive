import request from "supertest";
import app from "../../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import {
    createQuizChild,
    createQuizQuestions,
    createPlacementResult,
    buildAnswers,
    buildWrongAnswers,
} from "../helpers/testQuiz.js";
import { signAccessToken } from "../../utils/jwt.js";
import CategoryProgress from "../../models/categoryProgress.model.js";
import User from "../../models/User.js";

// ═════════════════════════════════════════════════════════════════════════════
beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
// ═════════════════════════════════════════════════════════════════════════════

async function createChildWithToken(age: number = 7, overrides: any = {}) {
    const child = await createQuizChild(age, overrides);
    const token = signAccessToken({ userId: child._id.toString(), role: "child" });
    return { child, token };
}


// ── GET /api/quiz/start ───────────────────────────────────────────────────────
describe("GET /api/quiz/start", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/quiz/start?categoryId=Nouns");
        expect(res.status).toBe(401);
    });

    it("returns 403 when parent token used", async () => {
        const token = signAccessToken({ userId: "parentid", role: "parent" });
        const res = await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    it("returns 400 when categoryId is missing", async () => {
        const { token } = await createChildWithToken();
        const res = await request(app)
            .get("/api/quiz/start")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toContain("categoryId is required");
    });

    it("returns questions and correctAnswers map for child", async () => {
        const { token } = await createChildWithToken(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        const res = await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.questions).toBeDefined();
        expect(res.body.questions.length).toBe(5);
        expect(res.body.correctAnswers).toBeDefined();
    });

    it("does NOT expose correctAnswer inside question objects", async () => {
        const { token } = await createChildWithToken(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        const res = await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        for (const q of res.body.questions) {
            expect(q.correctAnswer).toBeUndefined();
        }
        expect(Object.keys(res.body.correctAnswers).length).toBe(5);
    });

    it("returns easy questions for starter level child", async () => {
        const { token } = await createChildWithToken(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5);
        await createQuizQuestions("Nouns", "medium", "7-8", 5);
        await createQuizQuestions("Nouns", "hard", "7-8", 5);

        const res = await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.questions.every((q: any) => q.difficulty === "easy")).toBe(true);
    });

    it("returns medium questions for explorer level child", async () => {
        const { child, token } = await createChildWithToken(7);
        await createPlacementResult(child._id.toString(), "Nouns", "explorer");
        await createQuizQuestions("Nouns", "easy", "7-8", 5);
        await createQuizQuestions("Nouns", "medium", "7-8", 5);

        const res = await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.questions.every((q: any) => q.difficulty === "medium")).toBe(true);
    });

    it("returns hard questions for champion level child", async () => {
        const { child, token } = await createChildWithToken(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        await createQuizQuestions("Nouns", "hard", "7-8", 5);

        const res = await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.questions.every((q: any) => q.difficulty === "hard")).toBe(true);
    });

    it("respects targetLevel query param", async () => {
        const { token } = await createChildWithToken(7);
        // Child is starter but requests champion level
        await createQuizQuestions("Nouns", "hard", "7-8", 5);

        const res = await request(app)
            .get("/api/quiz/start?categoryId=Nouns&targetLevel=champion")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.questions.every((q: any) => q.difficulty === "hard")).toBe(true);
    });

    it("returns progress info with the quiz", async () => {
        const { token } = await createChildWithToken(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5);

        const res = await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.progress).toBeDefined();
        expect(res.body.progress.level).toBe("starter");
        expect(res.body.progress.xp).toBe(0);
        expect(res.body.progress.xpToNextLevel).toBe(50);
    });

});


// ── POST /api/quiz/submit ─────────────────────────────────────────────────────
describe("POST /api/quiz/submit", () => {

    it("returns 401 without token", async () => {
        const res = await request(app)
            .post("/api/quiz/submit")
            .send({ categoryId: "Nouns", answers: [] });
        expect(res.status).toBe(401);
    });

    it("returns 400 when categoryId is missing", async () => {
        const { token } = await createChildWithToken();
        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers: [] });
        expect(res.status).toBe(400);
    });

    it("returns 400 when answers is missing", async () => {
        const { token } = await createChildWithToken();
        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ categoryId: "Nouns" });
        expect(res.status).toBe(400);
    });

    it("returns score, passed, levelUp fields on submit", async () => {
        const { child, token } = await createChildWithToken(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        expect(res.status).toBe(200);
        expect(res.body.score).toBeDefined();
        expect(res.body.passed).toBeDefined();
        expect(res.body.levelUp).toBeDefined();
        expect(res.body.xpGained).toBeDefined();
        expect(res.body.totalGems).toBeDefined();
        expect(res.body.streak).toBeDefined();
    });

    it("returns passed=true for all correct fast answers", async () => {
        const { token } = await createChildWithToken(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        expect(res.body.passed).toBe(true);
        expect(res.body.score).toBe(100);
    });

    it("returns passed=false for all wrong answers", async () => {
        const { token } = await createChildWithToken(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildWrongAnswers(questions),
            });

        expect(res.body.passed).toBe(false);
        expect(res.body.score).toBe(0);
    });

    it("awards XP and gems on a passed quiz", async () => {
        const { token } = await createChildWithToken(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        expect(res.body.xpGained).toBeGreaterThan(0);
        expect(res.body.totalGems).toBeGreaterThan(0);
    });

    it("returns levelUp=true when XP reaches 50", async () => {
        const { child, token } = await createChildWithToken(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        // Set XP to 40 so one pass triggers level up
        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { xp: 40, level: "starter" },
            { upsert: true, new: true },
        );

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        expect(res.body.levelUp).toBe(true);
        expect(res.body.newLevel).toBe("explorer");
    });

    it("streak is incremented when playing on a new day", async () => {
        // Set lastPlayedDate to yesterday to simulate day boundary
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { child, token } = await createChildWithToken(7, {
            streak: 2,
            lastPlayedDate: yesterday,
        });
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        expect(res.body.streak).toBe(3); // 2+1
    });

    it("streak resets to 1 when a day was missed", async () => {
        // Last played 3 days ago = missed a day
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { token } = await createChildWithToken(7, {
            streak: 5,
            lastPlayedDate: threeDaysAgo,
        });
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        expect(res.body.streak).toBe(1); // reset
    });

    it("champion mode returns isChampion=true", async () => {
        const { child, token } = await createChildWithToken(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        expect(res.body.isChampion).toBe(true);
        expect(res.body.championBadge).toBeDefined();
        expect(res.body.championWins).toBe(1);
    });

    it("champion mode awards +20 totalXP on pass", async () => {
        const { child, token } = await createChildWithToken(7);
        await createPlacementResult(child._id.toString(), "Nouns", "champion");
        const questions = await createQuizQuestions("Nouns", "hard", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        // xpGained should include the 20 champion XP
        expect(res.body.xpGained).toBeGreaterThanOrEqual(20);
    });

});


// ── GET /api/quiz/progress/:categoryId ───────────────────────────────────────
describe("GET /api/quiz/progress/:categoryId", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/quiz/progress/Nouns");
        expect(res.status).toBe(401);
    });

    it("returns progress for a child's category", async () => {
        const { token } = await createChildWithToken(7);
        await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        // Start a quiz to create progress record
        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        const res = await request(app)
            .get("/api/quiz/progress/Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.level).toBe("starter");
        expect(res.body.xp).toBeDefined();
        expect(res.body.xpToNextLevel).toBe(50);
        expect(res.body.quizzesCompleted).toBeDefined();
        expect(res.body.championBadge).toBeDefined();
    });

    it("returns updated XP and quizzesCompleted after a quiz", async () => {
        const { token } = await createChildWithToken(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        const res = await request(app)
            .get("/api/quiz/progress/Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.xp).toBe(10);
        expect(res.body.quizzesCompleted).toBe(1);
    });

    it("reflects level change after level up", async () => {
        const { child, token } = await createChildWithToken(7);
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await CategoryProgress.findOneAndUpdate(
            { childId: child._id, categoryId: "Nouns" },
            { xp: 40, level: "starter" },
            { upsert: true, new: true },
        );

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        const res = await request(app)
            .get("/api/quiz/progress/Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.level).toBe("explorer");
    });

});


// ── GET /api/quiz/dashboard ───────────────────────────────────────────────────
describe("GET /api/quiz/dashboard", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/quiz/dashboard");
        expect(res.status).toBe(401);
    });

    it("returns child stats and categories", async () => {
        const { child, token } = await createChildWithToken(7);
        await createPlacementResult(child._id.toString(), "Nouns", "starter");

        const res = await request(app)
            .get("/api/quiz/dashboard")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.user.name).toBe("Quiz Child");
        expect(res.body.stats.totalXp).toBeDefined();
        expect(res.body.stats.gems).toBeDefined();
        expect(res.body.stats.streak).toBeDefined();
        expect(res.body.categories).toBeDefined();
        expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it("returns correct category data after quiz", async () => {
        const { child, token } = await createChildWithToken(7);
        await createPlacementResult(child._id.toString(), "Nouns", "starter");
        const questions = await createQuizQuestions("Nouns", "easy", "7-8", 5, "A");

        await request(app)
            .get("/api/quiz/start?categoryId=Nouns")
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/quiz/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                categoryId: "Nouns",
                answers: buildAnswers(questions, "A", 5),
            });

        const res = await request(app)
            .get("/api/quiz/dashboard")
            .set("Authorization", `Bearer ${token}`);

        const nounsCat = res.body.categories.find((c: any) => c.id === "Nouns");
        expect(nounsCat).toBeDefined();
        expect(nounsCat.xp).toBeGreaterThan(0);
    });

    it("streak is 0 when child has never played", async () => {
        const { token } = await createChildWithToken(7);

        const res = await request(app)
            .get("/api/quiz/dashboard")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.stats.streak).toBe(0);
    });

    it("shows streak reset to 0 when last played before yesterday", async () => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { token } = await createChildWithToken(7, {
            streak: 10,
            lastPlayedDate: threeDaysAgo,
        });

        const res = await request(app)
            .get("/api/quiz/dashboard")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.stats.streak).toBe(0); // expired streak
    });

});


// ── FULL ADAPTIVE FLOW TEST ───────────────────────────────────────────────────
describe("Full adaptive quiz flow", () => {

    it("child progresses from starter → explorer → champion through repeated passes", async () => {
        const { child, token } = await createChildWithToken(7);
        await createPlacementResult(child._id.toString(), "Nouns", "starter");
        await createQuizQuestions("Nouns", "easy", "7-8", 10, "A");
        await createQuizQuestions("Nouns", "medium", "7-8", 10, "A");
        await createQuizQuestions("Nouns", "hard", "7-8", 10, "A");

        // ── Phase 1: starter → explorer (need 50XP = 5 passes × 10XP) ──
        for (let i = 0; i < 5; i++) {
            const startRes = await request(app)
                .get("/api/quiz/start?categoryId=Nouns")
                .set("Authorization", `Bearer ${token}`);

            await request(app)
                .post("/api/quiz/submit")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    categoryId: "Nouns",
                    answers: buildAnswers(startRes.body.questions, "A", 5),
                });
        }

        let progress = await request(app)
            .get("/api/quiz/progress/Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(progress.body.level).toBe("explorer");
        expect(progress.body.xp).toBe(0); // reset on level up

        // ── Phase 2: explorer → champion (need another 50XP = 5 passes) ──
        for (let i = 0; i < 5; i++) {
            const startRes = await request(app)
                .get("/api/quiz/start?categoryId=Nouns")
                .set("Authorization", `Bearer ${token}`);

            await request(app)
                .post("/api/quiz/submit")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    categoryId: "Nouns",
                    answers: buildAnswers(startRes.body.questions, "A", 5),
                });
        }

        progress = await request(app)
            .get("/api/quiz/progress/Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(progress.body.level).toBe("champion");

        // ── Phase 3: champion wins accumulate (no more level ups) ──
        for (let i = 0; i < 3; i++) {
            const startRes = await request(app)
                .get("/api/quiz/start?categoryId=Nouns")
                .set("Authorization", `Bearer ${token}`);

            await request(app)
                .post("/api/quiz/submit")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    categoryId: "Nouns",
                    answers: buildAnswers(startRes.body.questions, "A", 5),
                });
        }

        progress = await request(app)
            .get("/api/quiz/progress/Nouns")
            .set("Authorization", `Bearer ${token}`);

        expect(progress.body.level).toBe("champion"); // stays champion
        expect(progress.body.championWins).toBe(3);
    });

});