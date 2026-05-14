import { describe, it, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createQuizChild } from "../helpers/testQuiz.js";
import User from "../../models/User.js";
import UnlockedGame from "../../models/unlockedGame.model.js";
import GameProgress from "../../models/gameProgress.model.js";
import {
    getGamesForChild,
    unlockGame,
    getLevelData,
    submitScore,
    GAME_CATALOG,
} from "../../services/game.service.js";

beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });

// ── getGamesForChild ──────────────────────────────────────────────────────────

describe("getGamesForChild", () => {

    it("returns all catalog games, all locked, with correct gem balance", async () => {
        const child = await createQuizChild(7, { gems: 250 });
        const result = await getGamesForChild(child._id.toString());

        expect(result.gems).toBe(250);
        expect(result.games.length).toBe(GAME_CATALOG.length);
        expect(result.games.every((g) => g.unlocked === false)).toBe(true);
    });

    it("marks a game as unlocked after an UnlockedGame record exists", async () => {
        const child = await createQuizChild(7, { gems: 500 });
        await UnlockedGame.create({ childId: child._id, gameId: "word-finder" });

        const result = await getGamesForChild(child._id.toString());

        const wordFinder = result.games.find((g) => g.id === "word-finder");
        expect(wordFinder?.unlocked).toBe(true);

        const others = result.games.filter((g) => g.id !== "word-finder");
        expect(others.every((g) => g.unlocked === false)).toBe(true);
    });

    it("includes progress data when GameProgress exists", async () => {
        const child = await createQuizChild(7, { gems: 500 });
        await UnlockedGame.create({ childId: child._id, gameId: "word-finder" });
        await GameProgress.create({
            childId: child._id,
            gameId: "word-finder",
            completedLevels: [1, 2],
            highestLevel: 2,
            totalGemsEarned: 11,
        });

        const result = await getGamesForChild(child._id.toString());

        const wordFinder = result.games.find((g) => g.id === "word-finder");
        expect(wordFinder?.completedLevels).toEqual([1, 2]);
        expect(wordFinder?.highestLevel).toBe(2);
        expect(wordFinder?.totalGemsEarned).toBe(11);
    });
});

// ── unlockGame ────────────────────────────────────────────────────────────────

describe("unlockGame", () => {

    it("deducts gemCost and creates UnlockedGame record", async () => {
        const child = await createQuizChild(7, { gems: 200 });

        const result = await unlockGame(child._id.toString(), "word-finder");

        expect(result.newGemBalance).toBe(100); // 200 - 100

        const unlocked = await UnlockedGame.findOne({ childId: child._id, gameId: "word-finder" });
        expect(unlocked).not.toBeNull();

        const updated = await User.findById(child._id);
        expect(updated!.gems).toBe(100);
    });

    it("throws 'Not enough gems' when balance is insufficient", async () => {
        const child = await createQuizChild(7, { gems: 50 });

        await expect(unlockGame(child._id.toString(), "word-finder")).rejects.toThrow(
            "Not enough gems"
        );
    });

    it("throws 'Game already unlocked' on duplicate unlock attempt", async () => {
        const child = await createQuizChild(7, { gems: 500 });
        await unlockGame(child._id.toString(), "word-finder");

        await expect(unlockGame(child._id.toString(), "word-finder")).rejects.toThrow(
            "Game already unlocked"
        );
    });

    it("throws 'Game not found' for unknown game IDs", async () => {
        const child = await createQuizChild(7, { gems: 500 });

        await expect(unlockGame(child._id.toString(), "nonexistent-game")).rejects.toThrow(
            "Game not found"
        );
    });

    it("allows unlocking each of the 3 catalog games independently", async () => {
        const child = await createQuizChild(7, { gems: 1000 });

        await unlockGame(child._id.toString(), "word-finder");
        await unlockGame(child._id.toString(), "spelling-challenge");
        await unlockGame(child._id.toString(), "word-builder");

        const count = await UnlockedGame.countDocuments({ childId: child._id });
        expect(count).toBe(3);

        const updated = await User.findById(child._id);
        expect(updated!.gems).toBe(1000 - 100 - 150 - 200);
    });
});

// ── getLevelData ──────────────────────────────────────────────────────────────

describe("getLevelData", () => {

    it("returns level data with totalLevels for a valid game+level", async () => {
        const result = await getLevelData("word-finder", 1);

        expect(result.level).toBe(1);
        expect(result.words).toBeDefined();
        expect(result.words.length).toBeGreaterThan(0);
        expect(result.totalLevels).toBe(5);
    });

    it("throws 'Level not found' for out-of-range level", async () => {
        await expect(getLevelData("word-finder", 99)).rejects.toThrow("Level not found");
    });

    it("throws 'Game not found' for unknown gameId", async () => {
        await expect(getLevelData("fake-game", 1)).rejects.toThrow("Game not found");
    });
});

// ── submitScore ───────────────────────────────────────────────────────────────

describe("submitScore", () => {

    async function setupUnlockedChild(gems = 500) {
        const child = await createQuizChild(7, { gems });
        await UnlockedGame.create({ childId: child._id, gameId: "word-finder" });
        return child;
    }

    it("awards gems for a new level completion and updates balance", async () => {
        const child = await setupUnlockedChild(500);
        const level1 = GAME_CATALOG.find((g) => g.id === "word-finder")!.levels[0];

        const result = await submitScore(child._id.toString(), "word-finder", 1);

        expect(result.isNewLevel).toBe(true);
        expect(result.gemsEarned).toBe(level1.gemsReward);
        expect(result.newGemBalance).toBe(500 + level1.gemsReward);
        expect(result.completedLevels).toContain(1);
    });

    it("awards 0 gems for replaying a completed level", async () => {
        const child = await setupUnlockedChild(500);

        await submitScore(child._id.toString(), "word-finder", 1);
        const result = await submitScore(child._id.toString(), "word-finder", 1);

        expect(result.isNewLevel).toBe(false);
        expect(result.gemsEarned).toBe(0);
    });

    it("tracks highestLevel as levels are completed in order", async () => {
        const child = await setupUnlockedChild(500);

        await submitScore(child._id.toString(), "word-finder", 1);
        await submitScore(child._id.toString(), "word-finder", 2);
        const result = await submitScore(child._id.toString(), "word-finder", 3);

        expect(result.highestLevel).toBe(3);
        expect(result.completedLevels).toEqual(expect.arrayContaining([1, 2, 3]));
    });

    it("throws 'Game not unlocked' when child has not purchased the game", async () => {
        const child = await createQuizChild(7, { gems: 500 });

        await expect(submitScore(child._id.toString(), "word-finder", 1)).rejects.toThrow(
            "Game not unlocked"
        );
    });

    it("throws 'Level not found' for an invalid level number", async () => {
        const child = await setupUnlockedChild(500);

        await expect(submitScore(child._id.toString(), "word-finder", 99)).rejects.toThrow(
            "Level not found"
        );
    });
});
