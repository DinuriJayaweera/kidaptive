import { describe, it, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createVerifiedParent, createChild } from "../helpers/testUser.js";
import mongoose from "mongoose";
import { recordMistake } from "../../services/mistakes.service.js";
import Mistake from "../../models/mistake.model.js";

beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });

function makeMistakeArgs(childId: string, overrides: Partial<Parameters<typeof recordMistake>[0]> = {}) {
    return {
        childId,
        questionId: new mongoose.Types.ObjectId().toString(),
        questionSource: "quiz" as const,
        questionText: "What is 2+2?",
        questionType: "mcq" as const,
        category: "Math",
        difficulty: "easy" as const,
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        childAnswer: "B",
        ...overrides,
    };
}

describe("recordMistake", () => {

    it("creates a new mistake record with correct fields", async () => {
        const parent = await createVerifiedParent();
        const child = await createChild(parent._id.toString());
        const args = makeMistakeArgs(child._id.toString());

        await recordMistake(args);

        const doc = await Mistake.findOne({ childId: child._id });
        expect(doc).not.toBeNull();
        expect(doc!.questionText).toBe("What is 2+2?");
        expect(doc!.questionSource).toBe("quiz");
        expect(doc!.category).toBe("Math");
        expect(doc!.difficulty).toBe("easy");
        expect(doc!.correctAnswer).toBe("A");
        expect(doc!.childAnswer).toBe("B");
        expect(doc!.resolved).toBe(false);
    });

    it("does not create a duplicate for the same child+question pair", async () => {
        const parent = await createVerifiedParent();
        const child = await createChild(parent._id.toString());
        const questionId = new mongoose.Types.ObjectId().toString();
        const args = makeMistakeArgs(child._id.toString(), { questionId });

        await recordMistake(args);
        await recordMistake(args);

        const count = await Mistake.countDocuments({ childId: child._id });
        expect(count).toBe(1);
    });

    it("records separate mistakes for different questions", async () => {
        const parent = await createVerifiedParent();
        const child = await createChild(parent._id.toString());

        await recordMistake(makeMistakeArgs(child._id.toString(), { questionId: new mongoose.Types.ObjectId().toString() }));
        await recordMistake(makeMistakeArgs(child._id.toString(), { questionId: new mongoose.Types.ObjectId().toString() }));

        const count = await Mistake.countDocuments({ childId: child._id });
        expect(count).toBe(2);
    });

    it("records separate mistakes for different children on the same question", async () => {
        const parent = await createVerifiedParent();
        const child1 = await createChild(parent._id.toString(), { email: "c1@child.kidaptive.local", username: "child1" });
        const child2 = await createChild(parent._id.toString(), { email: "c2@child.kidaptive.local", username: "child2" });
        const questionId = new mongoose.Types.ObjectId().toString();

        await recordMistake(makeMistakeArgs(child1._id.toString(), { questionId }));
        await recordMistake(makeMistakeArgs(child2._id.toString(), { questionId }));

        const count = await Mistake.countDocuments({ questionId: new mongoose.Types.ObjectId(questionId) });
        expect(count).toBe(2);
    });

    it("preserves original childAnswer on upsert (does not overwrite)", async () => {
        const parent = await createVerifiedParent();
        const child = await createChild(parent._id.toString());
        const questionId = new mongoose.Types.ObjectId().toString();

        await recordMistake(makeMistakeArgs(child._id.toString(), { questionId, childAnswer: "B" }));
        // Second call with different childAnswer — should be ignored ($setOnInsert)
        await recordMistake(makeMistakeArgs(child._id.toString(), { questionId, childAnswer: "C" }));

        const doc = await Mistake.findOne({ childId: child._id });
        expect(doc!.childAnswer).toBe("B");
    });

    it("supports placement as questionSource", async () => {
        const parent = await createVerifiedParent();
        const child = await createChild(parent._id.toString());
        const args = makeMistakeArgs(child._id.toString(), { questionSource: "placement" });

        await recordMistake(args);

        const doc = await Mistake.findOne({ childId: child._id });
        expect(doc!.questionSource).toBe("placement");
    });
});
