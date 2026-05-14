import request from "supertest";
import app from "../../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createQuizChild, setProgressXP } from "../helpers/testQuiz.js";
import { createVerifiedParent } from "../helpers/testUser.js";
import { signAccessToken } from "../../utils/jwt.js";
import CategoryProgress from "../../models/categoryProgress.model.js";

beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });

async function createChildWithToken(age = 7, overrides: any = {}) {
    const child = await createQuizChild(age, overrides);
    const token = signAccessToken({ userId: child._id.toString(), role: "child" });
    return { child, token };
}

// Give a child the minimum lessons required to appear on the leaderboard (MIN_LESSONS = 5)
async function giveMinLessons(childId: string, count = 5) {
    await CategoryProgress.findOneAndUpdate(
        { childId, categoryId: "Nouns" },
        { globalQuizzesCompleted: count },
        { upsert: true, new: true },
    );
}

// ── Auth guards ───────────────────────────────────────────────────────────────

describe("GET /api/child/leaderboard — auth guards", () => {

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/child/leaderboard");
        expect(res.status).toBe(401);
    });

    it("returns 403 when parent token used", async () => {
        const parent = await createVerifiedParent();
        const token = signAccessToken({ userId: parent._id.toString(), role: "parent" });
        const res = await request(app)
            .get("/api/child/leaderboard")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(403);
    });
});

// ── Unlock condition (MIN_LESSONS = 5) ────────────────────────────────────────

describe("GET /api/child/leaderboard — MIN_LESSONS unlock", () => {

    it("returns unlocked=false when child has fewer than 5 lessons", async () => {
        const { child, token } = await createChildWithToken(7, { totalXP: 50 });
        await giveMinLessons(child._id.toString(), 3);

        const res = await request(app)
            .get("/api/child/leaderboard")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.unlocked).toBe(false);
        expect(res.body.lessonsCompleted).toBe(3);
        expect(res.body.minLessons).toBe(5);
    });

    it("returns unlocked=true when child has >= 5 lessons", async () => {
        const { child, token } = await createChildWithToken(7, { totalXP: 50 });
        await giveMinLessons(child._id.toString(), 5);

        const res = await request(app)
            .get("/api/child/leaderboard")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.unlocked).toBe(true);
    });

    it("child with < MIN_LESSONS does not appear in leaderboard array", async () => {
        const { child, token } = await createChildWithToken(7, { totalXP: 200 });
        await giveMinLessons(child._id.toString(), 2); // below threshold

        const res = await request(app)
            .get("/api/child/leaderboard")
            .set("Authorization", `Bearer ${token}`);

        const entry = res.body.leaderboard.find((l: any) => l._id === child._id.toString());
        expect(entry).toBeUndefined();
    });
});

// ── Ranking order ─────────────────────────────────────────────────────────────

describe("GET /api/child/leaderboard — ranking", () => {

    it("sorts by totalXP descending", async () => {
        const { child: c1, token } = await createChildWithToken(7, { totalXP: 300, email: "c1@child.kidaptive.local", username: "c1" });
        const { child: c2 } = await createChildWithToken(7, { totalXP: 500, email: "c2@child.kidaptive.local", username: "c2" });
        const { child: c3 } = await createChildWithToken(8, { totalXP: 100, email: "c3@child.kidaptive.local", username: "c3" });

        await giveMinLessons(c1._id.toString());
        await giveMinLessons(c2._id.toString());
        await giveMinLessons(c3._id.toString());

        const res = await request(app)
            .get("/api/child/leaderboard?scope=global")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        const board = res.body.leaderboard;
        expect(board[0].totalXP).toBeGreaterThanOrEqual(board[1].totalXP);
        if (board.length > 2) {
            expect(board[1].totalXP).toBeGreaterThanOrEqual(board[2].totalXP);
        }
    });

    it("identifies currentChildRank for the authenticated child", async () => {
        const { child, token } = await createChildWithToken(7, { totalXP: 100 });
        await giveMinLessons(child._id.toString());

        const res = await request(app)
            .get("/api/child/leaderboard")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.currentChildRank).not.toBeNull();
        expect(res.body.currentChildRank._id).toBe(child._id.toString());
    });
});

// ── Scope parameter ───────────────────────────────────────────────────────────

describe("GET /api/child/leaderboard — scope", () => {

    it("age-group scope excludes children in different age brackets", async () => {
        // c1 (age 7) is the requesting child
        const { child: c1, token } = await createChildWithToken(7, { totalXP: 100, email: "c1@child.kidaptive.local", username: "c1a" });
        // c2 (age 9) is outside the 7-8 bracket
        const { child: c2 } = await createChildWithToken(9, { totalXP: 999, email: "c2@child.kidaptive.local", username: "c2a" });

        await giveMinLessons(c1._id.toString());
        await giveMinLessons(c2._id.toString());

        const res = await request(app)
            .get("/api/child/leaderboard?scope=age-group")
            .set("Authorization", `Bearer ${token}`);

        const ids = res.body.leaderboard.map((l: any) => l._id);
        expect(ids).not.toContain(c2._id.toString());
    });

    it("global scope includes children across all age groups", async () => {
        const { child: c1, token } = await createChildWithToken(7, { totalXP: 100, email: "c1@child.kidaptive.local", username: "c1b" });
        const { child: c2 } = await createChildWithToken(9, { totalXP: 200, email: "c2@child.kidaptive.local", username: "c2b" });

        await giveMinLessons(c1._id.toString());
        await giveMinLessons(c2._id.toString());

        const res = await request(app)
            .get("/api/child/leaderboard?scope=global")
            .set("Authorization", `Bearer ${token}`);

        const ids = res.body.leaderboard.map((l: any) => l._id);
        expect(ids).toContain(c2._id.toString());
    });

    it("returns scope field in the response body", async () => {
        const { token } = await createChildWithToken(7, { totalXP: 50 });

        const res = await request(app)
            .get("/api/child/leaderboard?scope=global")
            .set("Authorization", `Bearer ${token}`);

        expect(res.body.scope).toBe("global");
    });
});
