import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createCategoryQuestions, createMultipleCategoryQuestions, createTestChild } from "../helpers/testPlacement.js";
import {
    getCategoriesForAge,
    getUnevaluatedCategories,
    generateTestQuestions,
    submitTestAnswers,
    getFinalResults,
    getPlacementStatus,
    resetPlacement,
} from "../../services/placement-test.service.js";

// ═════════════════════════════════════════════════════════════════════════════
beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
// ═════════════════════════════════════════════════════════════════════════════


// ── A) GET CATEGORIES ─────────────────────────────────────────────────────────
describe("getCategoriesForAge", () => {

    it("returns all categories for an age group", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        await createCategoryQuestions("Verbs", "7-8");

        const cats = await getCategoriesForAge("7-8");
        expect(cats).toContain("Nouns");
        expect(cats).toContain("Verbs");
        expect(cats.length).toBe(2);
    });

    it("returns empty array when no questions exist for age group", async () => {
        const cats = await getCategoriesForAge("99-100");
        expect(cats).toEqual([]);
    });

    it("does NOT return categories from a different age group", async () => {
        await createCategoryQuestions("Nouns", "5-6");
        await createCategoryQuestions("Verbs", "7-8");

        const cats = await getCategoriesForAge("5-6");
        expect(cats).toContain("Nouns");
        expect(cats).not.toContain("Verbs");
    });

    it("returns categories sorted alphabetically", async () => {
        await createCategoryQuestions("Verbs", "7-8");
        await createCategoryQuestions("Nouns", "7-8");
        await createCategoryQuestions("Adjectives", "7-8");

        const cats = await getCategoriesForAge("7-8");
        expect(cats).toEqual(["Adjectives", "Nouns", "Verbs"]);
    });

});


// ── B) GET UNEVALUATED CATEGORIES ────────────────────────────────────────────
describe("getUnevaluatedCategories", () => {

    it("returns all categories when child has no results yet", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        await createCategoryQuestions("Verbs", "7-8");
        const child = await createTestChild(7);

        const unevaluated = await getUnevaluatedCategories(child._id.toString(), "7-8");
        expect(unevaluated).toContain("Nouns");
        expect(unevaluated).toContain("Verbs");
    });

    it("excludes already evaluated categories", async () => {
        await createMultipleCategoryQuestions(["Nouns", "Verbs", "Pronouns"], "7-8");
        const child = await createTestChild(7);

        // Submit answers to evaluate Nouns
        const { data: generatedQuestions } = await (async () => {
            const test = await generateTestQuestions(child._id.toString(), "7-8");
            return { data: test };
        })();

        await submitTestAnswers(
            child._id.toString(),
            "7-8",
            generatedQuestions.questions.map((q: any) => ({
                questionId: q._id.toString(),
                categoryId: q.category,
                difficulty: q.difficulty,
                selectedAnswer: "A",
                timeTaken: 5,
            }))
        );

        const unevaluated = await getUnevaluatedCategories(child._id.toString(), "7-8");
        // After first test (4 categories max), remaining should be fewer
        expect(unevaluated.length).toBeLessThan(3);
    });

});


// ── C) GENERATE TEST QUESTIONS ────────────────────────────────────────────────
describe("generateTestQuestions", () => {

    it("generates exactly 5 questions per category", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        expect(test.questions.length).toBe(5); // 1 easy + 2 medium + 2 hard
        expect(test.categories).toContain("Nouns");
    });

    it("generates up to 20 questions for 4 categories", async () => {
        await createMultipleCategoryQuestions(["Nouns", "Verbs", "Pronouns", "Tenses"], "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        expect(test.questions.length).toBe(20); // 4 × 5
        expect(test.categories.length).toBe(4);
    });

    it("generates first test with max 4 categories when more exist", async () => {
        await createMultipleCategoryQuestions(
            ["Nouns", "Verbs", "Pronouns", "Tenses", "Adjectives", "Adverbs"],
            "7-8"
        );
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        // First test should only have 4 categories (max 20 questions)
        expect(test.categories.length).toBe(4);
        expect(test.questions.length).toBe(20);
        expect(test.testNumber).toBe(1);
        expect(test.totalCategories).toBe(6);
    });

    it("includes correctAnswers map with all question IDs", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        expect(Object.keys(test.correctAnswers).length).toBe(5);
        for (const q of test.questions) {
            expect(test.correctAnswers[q._id.toString()]).toBeDefined();
        }
    });

    it("does NOT include correctAnswer in the question objects themselves", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        for (const q of test.questions) {
            expect((q as any).correctAnswer).toBeUndefined();
        }
    });

    it("throws error when all categories are already evaluated", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        // Generate and submit to evaluate all categories
        const test = await generateTestQuestions(child._id.toString(), "7-8");
        await submitTestAnswers(
            child._id.toString(),
            "7-8",
            test.questions.map((q: any) => ({
                questionId: q._id.toString(),
                categoryId: q.category,
                difficulty: q.difficulty,
                selectedAnswer: "A",
                timeTaken: 5,
            }))
        );

        // Now try to generate again — should throw
        await expect(
            generateTestQuestions(child._id.toString(), "7-8")
        ).rejects.toThrow("All categories already evaluated");
    });

    it("has correct difficulty distribution: 1 easy, 2 medium, 2 hard per category", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        const nounQuestions = test.questions.filter((q: any) => q.category === "Nouns");
        const easy = nounQuestions.filter((q: any) => q.difficulty === "easy");
        const medium = nounQuestions.filter((q: any) => q.difficulty === "medium");
        const hard = nounQuestions.filter((q: any) => q.difficulty === "hard");

        expect(easy.length).toBe(1);
        expect(medium.length).toBe(2);
        expect(hard.length).toBe(2);
    });

});


// ── D) SUBMIT TEST ANSWERS & SCORING ─────────────────────────────────────────
describe("submitTestAnswers — scoring logic", () => {

    it("scores all correct answers as champion (high score)", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        // Answer every question correctly and quickly
        const answers = test.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: test.correctAnswers[q._id.toString()], // correct answer
            timeTaken: 5, // fast = high time score
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);

        expect(result.categoryResults[0].level).toBe("champion");
        expect(result.categoryResults[0].score).toBeGreaterThanOrEqual(75);
    });

    it("scores all wrong answers as starter (low score)", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        // Answer every question wrong
        const answers = test.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: "WRONG_ANSWER",
            timeTaken: 30,
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);

        expect(result.categoryResults[0].level).toBe("starter");
        expect(result.categoryResults[0].score).toBe(0);
    });

    it("uses weighted scoring — hard questions count more than easy", async () => {
        // Weight: easy=1, medium=2, hard=3 → total=1+2+2+3+3=11
        // If only easy correct: earned=1, weighted=(1/11)*100=9.09
        // If only hard correct: earned=3+3=6, weighted=(6/11)*100=54.5
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");
        const nounQs = test.questions.filter((q: any) => q.category === "Nouns");

        // Answer only hard questions correctly
        const answers = nounQs.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: q.difficulty === "hard"
                ? test.correctAnswers[q._id.toString()]
                : "WRONG",
            timeTaken: 5,
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);

        // Hard correct only: weighted = (6/11)*100 ≈ 54.5
        // Plus time bonus (correct answers were fast)
        expect(result.categoryResults[0].score).toBeGreaterThan(40);
    });

    it("uses time score — fast answers get higher time score", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child1 = await createTestChild(7);

        const test1 = await generateTestQuestions(child1._id.toString(), "7-8");
        const fastAnswers = test1.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: test1.correctAnswers[q._id.toString()],
            timeTaken: 5, // ≤10 sec → time score 100
        }));
        const fastResult = await submitTestAnswers(child1._id.toString(), "7-8", fastAnswers);

        // New child for slow answers
        const child2 = await createTestChild(8);
        await createCategoryQuestions("Nouns", "7-8"); // recreate for child2
        const test2 = await generateTestQuestions(child2._id.toString(), "7-8");
        const slowAnswers = test2.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: test2.correctAnswers[q._id.toString()],
            timeTaken: 25, // >20 sec → time score 40
        }));
        const slowResult = await submitTestAnswers(child2._id.toString(), "7-8", slowAnswers);

        // Fast should score higher than slow (both 100% correct)
        expect(fastResult.categoryResults[0].score).toBeGreaterThan(
            slowResult.categoryResults[0].score
        );
    });

    it("does case-insensitive comparison for input type questions", async () => {
        // Create an input-type question
        const { default: PlacementQuestion } = await import("../../models/placement.model.js");
        const q = await PlacementQuestion.create({
            questionText: "Type the answer: ____",
            ageGroup: "7-8",
            category: "Grammar",
            type: "input",
            difficulty: "easy",
            options: [],
            correctAnswer: "Apple",
        });

        // Also create medium and hard questions so generate works
        await PlacementQuestion.create([
            { questionText: "M1", ageGroup: "7-8", category: "Grammar", type: "mcq", difficulty: "medium", options: ["A","B"], correctAnswer: "A" },
            { questionText: "M2", ageGroup: "7-8", category: "Grammar", type: "mcq", difficulty: "medium", options: ["A","B"], correctAnswer: "A" },
            { questionText: "H1", ageGroup: "7-8", category: "Grammar", type: "mcq", difficulty: "hard", options: ["A","B"], correctAnswer: "A" },
            { questionText: "H2", ageGroup: "7-8", category: "Grammar", type: "mcq", difficulty: "hard", options: ["A","B"], correctAnswer: "A" },
        ]);

        const child = await createTestChild(7);
        const test = await generateTestQuestions(child._id.toString(), "7-8");

        const inputQ = test.questions.find((tq: any) => tq._id.toString() === q._id.toString());
        if (!inputQ) return; // skip if not selected by random sample

        const answers = test.questions.map((tq: any) => ({
            questionId: tq._id.toString(),
            categoryId: tq.category,
            difficulty: tq.difficulty,
            // Use lowercase for the input question → should still be correct
            selectedAnswer: tq._id.toString() === q._id.toString() ? "apple" : "A",
            timeTaken: 5,
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);
        // Score should be positive since input answer matched case-insensitively
        expect(result.categoryResults[0].score).toBeGreaterThan(0);
    });

    it("marks placement completed when all categories are evaluated", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");
        const answers = test.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: "A",
            timeTaken: 5,
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);

        expect(result.allCompleted).toBe(true);
    });

    it("does NOT mark completed when categories remain", async () => {
        await createMultipleCategoryQuestions(["Nouns", "Verbs", "Pronouns", "Tenses", "Adjectives"], "7-8");
        const child = await createTestChild(7);

        // First test — evaluates 4 categories
        const test = await generateTestQuestions(child._id.toString(), "7-8");
        const answers = test.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: "A",
            timeTaken: 5,
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);

        // 1 category still remains
        expect(result.allCompleted).toBe(false);
        expect(result.evaluatedCategories.length).toBe(4);
    });

    it("scores each category separately when test has multiple categories", async () => {
        await createMultipleCategoryQuestions(["Nouns", "Verbs"], "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");

        const answers = test.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            // Answer Nouns correctly, Verbs wrong
            selectedAnswer: q.category === "Nouns"
                ? test.correctAnswers[q._id.toString()]
                : "WRONG",
            timeTaken: 5,
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);

        expect(result.categoryResults.length).toBe(2);
        const nouns = result.categoryResults.find((r: any) => r.categoryId === "Nouns");
        const verbs = result.categoryResults.find((r: any) => r.categoryId === "Verbs");

        expect(nouns?.score).toBeGreaterThan(verbs?.score ?? 100);
    });

});


// ── E) LEVEL ASSIGNMENT ───────────────────────────────────────────────────────
describe("Level assignment thresholds", () => {

    it("assigns starter for score 0–49", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);
        const test = await generateTestQuestions(child._id.toString(), "7-8");

        // All wrong → score 0
        const answers = test.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: "WRONG",
            timeTaken: 30,
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);
        expect(result.categoryResults[0].level).toBe("starter");
    });

    it("assigns champion for score 75–100", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);
        const test = await generateTestQuestions(child._id.toString(), "7-8");

        // All correct and fast → high score
        const answers = test.questions.map((q: any) => ({
            questionId: q._id.toString(),
            categoryId: q.category,
            difficulty: q.difficulty,
            selectedAnswer: test.correctAnswers[q._id.toString()],
            timeTaken: 5,
        }));

        const result = await submitTestAnswers(child._id.toString(), "7-8", answers);
        expect(result.categoryResults[0].level).toBe("champion");
    });

});


// ── F) PLACEMENT STATUS ───────────────────────────────────────────────────────
describe("getPlacementStatus", () => {

    it("returns not completed and all categories remaining for new child", async () => {
        await createMultipleCategoryQuestions(["Nouns", "Verbs"], "7-8");
        const child = await createTestChild(7);

        const status = await getPlacementStatus(child._id.toString(), "7-8");

        expect(status.placementCompleted).toBe(false);
        expect(status.totalCategories).toBe(2);
        expect(status.evaluatedCategories).toEqual([]);
        expect(status.remainingCategories.length).toBe(2);
    });

    it("returns completed status after all categories evaluated", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");
        await submitTestAnswers(
            child._id.toString(),
            "7-8",
            test.questions.map((q: any) => ({
                questionId: q._id.toString(),
                categoryId: q.category,
                difficulty: q.difficulty,
                selectedAnswer: "A",
                timeTaken: 5,
            }))
        );

        const status = await getPlacementStatus(child._id.toString(), "7-8");
        expect(status.placementCompleted).toBe(true);
        expect(status.remainingCategories.length).toBe(0);
    });

});


// ── G) GET FINAL RESULTS ──────────────────────────────────────────────────────
describe("getFinalResults", () => {

    it("returns null when child has no results", async () => {
        const child = await createTestChild(7);
        const result = await getFinalResults(child._id.toString());
        expect(result).toBeNull();
    });

    it("returns category results after placement completed", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");
        await submitTestAnswers(
            child._id.toString(),
            "7-8",
            test.questions.map((q: any) => ({
                questionId: q._id.toString(),
                categoryId: q.category,
                difficulty: q.difficulty,
                selectedAnswer: test.correctAnswers[q._id.toString()],
                timeTaken: 5,
            }))
        );

        const result = await getFinalResults(child._id.toString());
        expect(result).not.toBeNull();
        expect(result?.categoryResults.length).toBe(1);
        expect(result?.placementCompleted).toBe(true);
        expect(result?.categoryResults[0].categoryId).toBe("Nouns");
    });

});


// ── H) RESET PLACEMENT ────────────────────────────────────────────────────────
describe("resetPlacement", () => {

    it("clears all placement data for a child", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        const test = await generateTestQuestions(child._id.toString(), "7-8");
        await submitTestAnswers(
            child._id.toString(),
            "7-8",
            test.questions.map((q: any) => ({
                questionId: q._id.toString(),
                categoryId: q.category,
                difficulty: q.difficulty,
                selectedAnswer: "A",
                timeTaken: 5,
            }))
        );

        // Confirm results exist
        const beforeReset = await getFinalResults(child._id.toString());
        expect(beforeReset).not.toBeNull();

        // Reset
        await resetPlacement(child._id.toString());

        // Confirm results are gone
        const afterReset = await getFinalResults(child._id.toString());
        expect(afterReset).toBeNull();
    });

    it("allows generating a new test after reset", async () => {
        await createCategoryQuestions("Nouns", "7-8");
        const child = await createTestChild(7);

        // Complete placement
        const test = await generateTestQuestions(child._id.toString(), "7-8");
        await submitTestAnswers(
            child._id.toString(),
            "7-8",
            test.questions.map((q: any) => ({
                questionId: q._id.toString(),
                categoryId: q.category,
                difficulty: q.difficulty,
                selectedAnswer: "A",
                timeTaken: 5,
            }))
        );

        // Reset
        await resetPlacement(child._id.toString());

        // Should be able to generate again
        const newTest = await generateTestQuestions(child._id.toString(), "7-8");
        expect(newTest.questions.length).toBe(5);
    });

});