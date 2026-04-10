import PlacementQuestion from "../models/placement.model.js";
import PlacementResult from "../models/placementResult.model.js";
import type { IPlacementAnswer, ICategoryResult } from "../models/placementResult.model.js";

// ── Weight map ──────────────────────────────────────────────────────────────
const DIFFICULTY_WEIGHT: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

// ── Time score lookup ───────────────────────────────────────────────────────
function timeScore(seconds: number): number {
  if (seconds <= 10) return 100;
  if (seconds <= 15) return 80;
  if (seconds <= 20) return 60;
  return 40;
}

// ── Level from score ────────────────────────────────────────────────────────
function assignLevel(score: number): "starter" | "explorer" | "champion" {
  if (score < 50) return "starter";
  if (score < 75) return "explorer";
  return "champion";
}

// ── Get all categories for an age group ─────────────────────────────────────
export async function getCategoriesForAge(ageGroup: string): Promise<string[]> {
  const cats = await PlacementQuestion.distinct("category", { ageGroup });
  return cats.sort();
}

// ── Get unevaluated categories ──────────────────────────────────────────────
export async function getUnevaluatedCategories(
  childId: string,
  ageGroup: string
): Promise<string[]> {
  const allCategories = await getCategoriesForAge(ageGroup);
  const result = await PlacementResult.findOne({ childId });

  if (!result) return allCategories;

  const evaluated = new Set(result.evaluatedCategories);
  return allCategories.filter((c) => !evaluated.has(c));
}

// ── Generate test questions ─────────────────────────────────────────────────
// First test: up to 4 categories × 5 questions = 20
// Subsequent tests: remaining categories × 5 questions (variable count)
export async function generateTestQuestions(
  childId: string,
  ageGroup: string
): Promise<{
  questions: any[];
  categories: string[];
  testNumber: number;
  totalCategories: number;
  correctAnswers: Record<string, string>;
}> {
  const unevaluated = await getUnevaluatedCategories(childId, ageGroup);
  if (unevaluated.length === 0) {
    throw new Error("All categories already evaluated");
  }

  const allCategories = await getCategoriesForAge(ageGroup);
  const result = await PlacementResult.findOne({ childId });
  const testNumber = result ? Math.floor(result.evaluatedCategories.length / 4) + 1 : 1;

  // First test: take up to 4 categories. Subsequent: take remaining (up to 4)
  const batchSize = Math.min(4, unevaluated.length);
  const testCategories = unevaluated.slice(0, batchSize);

  // For each category: 1 easy, 2 medium, 2 hard (random)
  const questions: any[] = [];

  for (const category of testCategories) {
    const distribution = [
      { difficulty: "easy", count: 1 },
      { difficulty: "medium", count: 2 },
      { difficulty: "hard", count: 2 },
    ];

    for (const { difficulty, count } of distribution) {
      const sampled = await PlacementQuestion.aggregate([
        { $match: { ageGroup, category, difficulty } },
        { $sample: { size: count } },
      ]);
      questions.push(...sampled);
    }
  }

  // Build correctAnswers map (for client-side feedback)
  const correctAnswers: Record<string, string> = {};
  for (const q of questions) {
    correctAnswers[q._id.toString()] = q.correctAnswer;
  }

  // Shuffle questions so categories are mixed
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return {
    questions: questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      type: q.type,
      category: q.category,
      difficulty: q.difficulty,
      options: q.options,
      // correctAnswer is NOT sent in the question list — it goes in the separate map
    })),
    categories: testCategories,
    testNumber,
    totalCategories: allCategories.length,
    correctAnswers, // map of questionId → correctAnswer
  };
}

// ── Score a single category ─────────────────────────────────────────────────
function scoreCategoryAnswers(answers: IPlacementAnswer[]): ICategoryResult {
  const categoryId = answers[0].categoryId;

  // Weighted score
  let earnedWeight = 0;
  let totalWeight = 0;
  const correctTimings: number[] = [];

  for (const a of answers) {
    const w = DIFFICULTY_WEIGHT[a.difficulty] ?? 1;
    totalWeight += w;
    if (a.isCorrect) {
      earnedWeight += w;
      correctTimings.push(a.timeTaken);
    }
  }

  const weightedScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;

  // Time score (average of correct answers only)
  let avgTimeScore = 0;
  if (correctTimings.length > 0) {
    avgTimeScore =
      correctTimings.reduce((sum, t) => sum + timeScore(t), 0) / correctTimings.length;
  }

  // Final score
  const finalScore = Math.round(0.8 * weightedScore + 0.2 * avgTimeScore);
  const level = assignLevel(finalScore);

  return { categoryId, score: finalScore, level };
}

// ── Submit test answers & score ─────────────────────────────────────────────
export async function submitTestAnswers(
  childId: string,
  ageGroup: string,
  answers: Array<{
    questionId: string;
    categoryId: string;
    difficulty: string;
    selectedAnswer: string;
    timeTaken: number;
  }>
): Promise<{
  categoryResults: ICategoryResult[];
  allCompleted: boolean;
  evaluatedCategories: string[];
}> {
  // Look up actual questions for server-side correctness verification
  const questionIds = answers.map((a) => a.questionId);
  const questions = await PlacementQuestion.find({ _id: { $in: questionIds } });
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  // Verify correctness server-side
  const verifiedAnswers: IPlacementAnswer[] = answers.map((a) => {
    const q = questionMap.get(a.questionId);

    // For "input" type: case-insensitive, trimmed comparison
    // For mcq/fill/boolean: exact match
    let isCorrect = false;
    if (q) {
      if (q.type === "input") {
        isCorrect = q.correctAnswer.trim().toLowerCase() === (a.selectedAnswer || "").trim().toLowerCase();
      } else {
        isCorrect = q.correctAnswer === a.selectedAnswer;
      }
    }

    return {
      questionId: q?._id ?? a.questionId,
      categoryId: q?.category ?? a.categoryId,
      difficulty: (q?.difficulty ?? a.difficulty) as "easy" | "medium" | "hard",
      selectedAnswer: a.selectedAnswer,
      isCorrect,
      timeTaken: Math.max(0, a.timeTaken),
    } as IPlacementAnswer;
  });

  // Group by category and score
  const byCategory = new Map<string, IPlacementAnswer[]>();
  for (const a of verifiedAnswers) {
    if (!byCategory.has(a.categoryId)) byCategory.set(a.categoryId, []);
    byCategory.get(a.categoryId)!.push(a);
  }

  const newCategoryResults: ICategoryResult[] = [];
  const newEvaluatedCategories: string[] = [];
  for (const [, catAnswers] of byCategory) {
    const result = scoreCategoryAnswers(catAnswers);
    newCategoryResults.push(result);
    newEvaluatedCategories.push(result.categoryId);
  }

  // Upsert placement result
  let placementResult = await PlacementResult.findOne({ childId });
  if (!placementResult) {
    placementResult = new PlacementResult({
      childId,
      ageGroup,
      evaluatedCategories: [],
      categoryResults: [],
      answers: [],
      placementCompleted: false,
    });
  }

  // Append new results (do NOT overwrite previous test results)
  placementResult.evaluatedCategories.push(...newEvaluatedCategories);
  placementResult.categoryResults.push(...newCategoryResults);
  placementResult.answers.push(...verifiedAnswers);

  // Check if ALL categories are now evaluated
  const allCategories = await getCategoriesForAge(ageGroup);
  const allCompleted = allCategories.every((c) =>
    placementResult!.evaluatedCategories.includes(c)
  );

  if (allCompleted) {
    placementResult.placementCompleted = true;
  }

  await placementResult.save();

  return {
    categoryResults: newCategoryResults,
    allCompleted,
    evaluatedCategories: placementResult.evaluatedCategories,
  };
}

// ── Get final results ───────────────────────────────────────────────────────
export async function getFinalResults(childId: string) {
  const result = await PlacementResult.findOne({ childId });
  if (!result) return null;
  return {
    categoryResults: result.categoryResults,
    evaluatedCategories: result.evaluatedCategories,
    placementCompleted: result.placementCompleted,
  };
}

// ── Check placement status ──────────────────────────────────────────────────
export async function getPlacementStatus(childId: string, ageGroup: string) {
  const result = await PlacementResult.findOne({ childId });
  const allCategories = await getCategoriesForAge(ageGroup);

  return {
    placementCompleted: result?.placementCompleted ?? false,
    evaluatedCategories: result?.evaluatedCategories ?? [],
    totalCategories: allCategories.length,
    remainingCategories: allCategories.filter(
      (c) => !result?.evaluatedCategories.includes(c)
    ),
  };
}

// ── Reset placement (for restart) ───────────────────────────────────────────
export async function resetPlacement(childId: string) {
  await PlacementResult.deleteOne({ childId });
}
