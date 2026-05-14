import request from "supertest";
import app from "../../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createQuizChild } from "../helpers/testQuiz.js";
import { createVerifiedParent } from "../helpers/testUser.js";
import { signAccessToken } from "../../utils/jwt.js";
import UnlockedGame from "../../models/unlockedGame.model.js";

beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });

async function createChildWithToken(gems = 0) {
    const child = await createQuizChild(7, { gems });
    const token = signAccessToken({ userId: child._id.toString(), role: "child" });
    return { child, token };
}

// ── GET /api/games ────────────────────────────────────────────────────────────

describe("GET /api/games", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/games");
        expect(res.status).toBe(401);
    });

    it("returns 403 when parent token used", async () => {
        const parent = await createVerifiedParent();
        const token = signAccessToken({ userId: parent._id.toString(), role: "parent" });
        const res = await request(app)
            .get("/api/games")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    it("returns all games with unlocked=false and gem balance for fresh child", async () => {
        const { token } = await createChildWithToken(100);
        const res = await request(app)
            .get("/api/games")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.gems).toBe(100);
        expect(res.body.games).toBeDefined();
        expect(res.body.games.length).toBeGreaterThan(0);
        expect(res.body.games.every((g: any) => g.unlocked === false)).toBe(true);
    });
});

// ── POST /api/games/unlock ────────────────────────────────────────────────────

describe("POST /api/games/unlock", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).post("/api/games/unlock").send({ gameId: "word-finder" });
        expect(res.status).toBe(401);
    });

    it("unlocks game and returns new gem balance", async () => {
        const { token } = await createChildWithToken(200);

        const res = await request(app)
            .post("/api/games/unlock")
            .set("Authorization", `Bearer ${token}`)
            .send({ gameId: "word-finder" });

        expect(res.status).toBe(200);
        expect(res.body.newGemBalance).toBe(100); // 200 - 100
    });

    it("returns 400 when gems are insufficient", async () => {
        const { token } = await createChildWithToken(50);

        const res = await request(app)
            .post("/api/games/unlock")
            .set("Authorization", `Bearer ${token}`)
            .send({ gameId: "word-finder" });

        expect(res.status).toBe(400);
    });

    it("returns 409 when game is already unlocked", async () => {
        const { child, token } = await createChildWithToken(500);
        await UnlockedGame.create({ childId: child._id, gameId: "word-finder" });

        const res = await request(app)
            .post("/api/games/unlock")
            .set("Authorization", `Bearer ${token}`)
            .send({ gameId: "word-finder" });

        expect(res.status).toBe(409);
    });

    it("returns 404 for unknown gameId", async () => {
        const { token } = await createChildWithToken(500);

        const res = await request(app)
            .post("/api/games/unlock")
            .set("Authorization", `Bearer ${token}`)
            .send({ gameId: "fake-game" });

        expect(res.status).toBe(404);
    });
});

// ── GET /api/games/:gameId/levels ─────────────────────────────────────────────

describe("GET /api/games/:gameId/levels", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/games/word-finder/levels?level=1");
        expect(res.status).toBe(401);
    });

    it("returns level data for a valid game and level", async () => {
        const { child, token } = await createChildWithToken(500);
        await UnlockedGame.create({ childId: child._id, gameId: "word-finder" });

        const res = await request(app)
            .get("/api/games/word-finder/levels?level=1")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.level).toBe(1);
        expect(res.body.words).toBeDefined();
        expect(res.body.totalLevels).toBe(5);
    });

    it("returns 404 for an out-of-range level", async () => {
        const { child, token } = await createChildWithToken(500);
        await UnlockedGame.create({ childId: child._id, gameId: "word-finder" });

        const res = await request(app)
            .get("/api/games/word-finder/levels?level=99")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

// ── POST /api/games/:gameId/score ────────────────────────────────────────────

describe("POST /api/games/:gameId/score", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).post("/api/games/word-finder/score").send({ level: 1 });
        expect(res.status).toBe(401);
    });

    it("awards gems for a new level completion", async () => {
        const { child, token } = await createChildWithToken(200);
        await UnlockedGame.create({ childId: child._id, gameId: "word-finder" });

        const res = await request(app)
            .post("/api/games/word-finder/score")
            .set("Authorization", `Bearer ${token}`)
            .send({ level: 1 });

        expect(res.status).toBe(200);
        expect(res.body.isNewLevel).toBe(true);
        expect(res.body.gemsEarned).toBeGreaterThan(0);
    });

    it("awards 0 gems for replay of a completed level", async () => {
        const { child, token } = await createChildWithToken(200);
        await UnlockedGame.create({ childId: child._id, gameId: "word-finder" });

        await request(app)
            .post("/api/games/word-finder/score")
            .set("Authorization", `Bearer ${token}`)
            .send({ level: 1 });

        const res = await request(app)
            .post("/api/games/word-finder/score")
            .set("Authorization", `Bearer ${token}`)
            .send({ level: 1 });

        expect(res.status).toBe(200);
        expect(res.body.isNewLevel).toBe(false);
        expect(res.body.gemsEarned).toBe(0);
    });

    it("returns 403 when game is not unlocked", async () => {
        const { token } = await createChildWithToken(0);

        const res = await request(app)
            .post("/api/games/word-finder/score")
            .set("Authorization", `Bearer ${token}`)
            .send({ level: 1 });

        expect(res.status).toBe(403);
    });
});
