import request from "supertest";
import app from "../../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createCategoryQuestions, createMultipleCategoryQuestions, createTestChild } from "../helpers/testPlacement.js";
import { signAccessToken } from "../../utils/jwt.js";

// ═════════════════════════════════════════════════════════════════════════════
beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
// ═════════════════════════════════════════════════════════════════════════════

// Helper — create child and get their auth token
async function createChildWithToken(age: number = 7) {
    const child = await createTestChild(age);
    const token = signAccessToken({ userId: child._id.toString(), role: "child" });
    return { child, token };
}


// ── GET /api/placement-test/status ────────────────────────────────────────────
describe("GET /api/placement-test/status", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/placement-test/status");
        expect(res.status).toBe(401);
    });

    it("returns placement status for new child", async () => {
        await createMultipleCategoryQuestions(["Nouns", "Verbs"], "7-8");
        const { token } = await createChildWithToken(7);

        const res = await request(app)
            .get("/api/placement-test/status")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.placementCompleted).toBe(false);
        expect(res.body.totalCategories).toBe(2);
        expect(res.body.evaluatedCategories).toEqual([]);
        expect(res.body.remainingCategories.length).toBe(2);
    });

    it("returns 403 when parent token is used", async () => {
        const parentToken = signAccessToken({ userId: "parentid", role: "parent" });

        const res = await request(app)
            .get("/api/placement-test/status")
            .set("Authorization", `Bearer ${parentToken}`);

        expect(res.status).toBe(403);
    });

});


// ── POST /api/placement-test/generate ────────────────────────────────────────
describe("POST /api/placement-test/generate", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).post("/api/placement-test/generate");
        expect(res.status).toBe(401);
    });

    it("generates test questions for child", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { token } = await createChildWithToken(7);

        const res = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.questions).toBeDefined();
        expect(res.body.questions.length).toBe(5);
        expect(res.body.categories).toContain("Nouns");
        expect(res.body.correctAnswers).toBeDefined();
        expect(res.body.testNumber).toBe(1);
        expect(res.body.totalCategories).toBe(1);
    });

    it("correctAnswer is NOT in the question objects (only in the map)", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { token } = await createChildWithToken(7);

        const res = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        for (const q of res.body.questions) {
            expect(q.correctAnswer).toBeUndefined();
        }
        expect(Object.keys(res.body.correctAnswers).length).toBe(5);
    });

    it("generates max 4 categories per test when more exist", async () => {
        await createMultipleCategoryQuestions(
            ["Nouns", "Verbs", "Pronouns", "Tenses", "Adjectives"],
            "7-8"
        );
        const { token } = await createChildWithToken(7);

        const res = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.categories.length).toBe(4);
        expect(res.body.questions.length).toBe(20);
        expect(res.body.totalCategories).toBe(5);
    });

    it("returns 400 with allCompleted flag when all categories evaluated", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { child, token } = await createChildWithToken(7);

        // Generate and submit to complete placement
        const genRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        const answers = genRes.body.questions.map((q: any) => ({
            questionId: q._id,
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: "A",
            timeTaken: 5,
        }));

        await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers });

        // Try to generate again
        const res = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.allCompleted).toBe(true);
    });

});


// ── POST /api/placement-test/submit ──────────────────────────────────────────
describe("POST /api/placement-test/submit", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).post("/api/placement-test/submit").send({ answers: [] });
        expect(res.status).toBe(401);
    });

    it("returns 400 when answers array is empty", async () => {
        const { token } = await createChildWithToken(7);

        const res = await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers: [] });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain("Answers are required");
    });

    it("returns 400 when answers field is missing", async () => {
        const { token } = await createChildWithToken(7);

        const res = await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });

    it("returns category results after submission", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { token } = await createChildWithToken(7);

        const genRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        const answers = genRes.body.questions.map((q: any) => ({
            questionId: q._id,
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: genRes.body.correctAnswers[q._id], // all correct
            timeTaken: 5,
        }));

        const res = await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers });

        expect(res.status).toBe(200);
        expect(res.body.categoryResults.length).toBe(1);
        expect(res.body.categoryResults[0].categoryId).toBe("Nouns");
        expect(res.body.categoryResults[0].level).toBe("champion");
        expect(res.body.allCompleted).toBe(true);
    });

    it("scores all wrong answers as starter level", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { token } = await createChildWithToken(7);

        const genRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        const answers = genRes.body.questions.map((q: any) => ({
            questionId: q._id,
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: "COMPLETELY_WRONG",
            timeTaken: 30,
        }));

        const res = await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers });

        expect(res.status).toBe(200);
        expect(res.body.categoryResults[0].level).toBe("starter");
        expect(res.body.categoryResults[0].score).toBe(0);
    });

    it("marks allCompleted false when categories remain", async () => {
        await createMultipleCategoryQuestions(["Nouns", "Verbs", "Pronouns", "Tenses", "Adjectives"], "7-8");
        const { token } = await createChildWithToken(7);

        const genRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        const answers = genRes.body.questions.map((q: any) => ({
            questionId: q._id,
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: "A",
            timeTaken: 5,
        }));

        const res = await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers });

        expect(res.body.allCompleted).toBe(false);
        expect(res.body.evaluatedCategories.length).toBe(4);
    });

});


// ── GET /api/placement-test/results ──────────────────────────────────────────
describe("GET /api/placement-test/results", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/placement-test/results");
        expect(res.status).toBe(401);
    });

    it("returns 404 when child has no placement results", async () => {
        const { token } = await createChildWithToken(7);

        const res = await request(app)
            .get("/api/placement-test/results")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it("returns results after placement completed", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { token } = await createChildWithToken(7);

        // Generate and submit
        const genRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        const answers = genRes.body.questions.map((q: any) => ({
            questionId: q._id,
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: genRes.body.correctAnswers[q._id],
            timeTaken: 5,
        }));

        await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({ answers });

        // Get results
        const res = await request(app)
            .get("/api/placement-test/results")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.categoryResults.length).toBe(1);
        expect(res.body.placementCompleted).toBe(true);
        expect(res.body.evaluatedCategories).toContain("Nouns");
    });

});


// ── POST /api/placement-test/reset ───────────────────────────────────────────
describe("POST /api/placement-test/reset", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).post("/api/placement-test/reset");
        expect(res.status).toBe(401);
    });

    it("resets placement and returns success message", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { token } = await createChildWithToken(7);

        // Complete placement first
        const genRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                answers: genRes.body.questions.map((q: any) => ({
                    questionId: q._id,
                    categoryId: q.category,
                    difficulty: q.difficulty,
                    selectedAnswer: "A",
                    timeTaken: 5,
                })),
            });

        // Reset
        const res = await request(app)
            .post("/api/placement-test/reset")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("reset");
    });

    it("allows generating a new test after reset", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { token } = await createChildWithToken(7);

        // Complete and reset
        const genRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                answers: genRes.body.questions.map((q: any) => ({
                    questionId: q._id,
                    categoryId: q.category,
                    difficulty: q.difficulty,
                    selectedAnswer: "A",
                    timeTaken: 5,
                })),
            });

        await request(app)
            .post("/api/placement-test/reset")
            .set("Authorization", `Bearer ${token}`);

        // Now generate again — should work
        const newGenRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        expect(newGenRes.status).toBe(200);
        expect(newGenRes.body.questions.length).toBe(5);
    });

    it("status shows not completed after reset", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const { token } = await createChildWithToken(7);

        // Complete placement
        const genRes = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                answers: genRes.body.questions.map((q: any) => ({
                    questionId: q._id,
                    categoryId: q.category,
                    difficulty: q.difficulty,
                    selectedAnswer: "A",
                    timeTaken: 5,
                })),
            });

        // Reset
        await request(app)
            .post("/api/placement-test/reset")
            .set("Authorization", `Bearer ${token}`);

        // Status should show not completed
        const statusRes = await request(app)
            .get("/api/placement-test/status")
            .set("Authorization", `Bearer ${token}`);

        expect(statusRes.body.placementCompleted).toBe(false);
        expect(statusRes.body.evaluatedCategories).toEqual([]);
    });

});


// ── FULL FLOW TEST ────────────────────────────────────────────────────────────
describe("Full placement test flow", () => {

    it("completes multi-test flow: 6 categories → 2 tests", async () => {
        await createMultipleCategoryQuestions(
            ["Nouns", "Verbs", "Pronouns", "Tenses", "Adjectives", "Adverbs"],
            "7-8"
        );
        const { token } = await createChildWithToken(7);

        // ── Test 1: 4 categories ──
        const gen1 = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        expect(gen1.body.categories.length).toBe(4);
        expect(gen1.body.testNumber).toBe(1);

        const submit1 = await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                answers: gen1.body.questions.map((q: any) => ({
                    questionId: q._id,
                    categoryId: q.category,
                    difficulty: q.difficulty,
                    selectedAnswer: gen1.body.correctAnswers[q._id],
                    timeTaken: 5,
                })),
            });

        expect(submit1.body.allCompleted).toBe(false);
        expect(submit1.body.evaluatedCategories.length).toBe(4);

        // ── Test 2: remaining 2 categories ──
        const gen2 = await request(app)
            .post("/api/placement-test/generate")
            .set("Authorization", `Bearer ${token}`);

        expect(gen2.body.categories.length).toBe(2);
        expect(gen2.body.testNumber).toBe(2);

        const submit2 = await request(app)
            .post("/api/placement-test/submit")
            .set("Authorization", `Bearer ${token}`)
            .send({
                answers: gen2.body.questions.map((q: any) => ({
                    questionId: q._id,
                    categoryId: q.category,
                    difficulty: q.difficulty,
                    selectedAnswer: gen2.body.correctAnswers[q._id],
                    timeTaken: 5,
                })),
            });

        expect(submit2.body.allCompleted).toBe(true);
        expect(submit2.body.evaluatedCategories.length).toBe(6);

        // ── Final results ──
        const resultsRes = await request(app)
            .get("/api/placement-test/results")
            .set("Authorization", `Bearer ${token}`);

        expect(resultsRes.body.categoryResults.length).toBe(6);
        expect(resultsRes.body.placementCompleted).toBe(true);
    });

});