import mongoose from "mongoose";
import User from "../models/User.js";
import QuizQuestion from "../models/quizQuestion.model.js";
import CategoryProgress from "../models/categoryProgress.model.js";
import PlacementResult from "../models/placementResult.model.js";

// ── Types ────────────────────────────────────────────────────────────────────
interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
}

// ── Start Quiz ───────────────────────────────────────────────────────────────
export async function startQuiz(childId: string, categoryId: string) {
  const child = await User.findById(childId);
  if (!child) throw new Error("Child not found");

  const ageGroup = child.age ? `${child.age}-${child.age + 1}` : "5-6";

  // 1. Get or create Category Progress
  let progress = await CategoryProgress.findOne({ childId, categoryId });
  if (!progress) {
    // Attempt to initialize from PlacementResult
    const placement = await PlacementResult.findOne({ childId });
    let initialLevel = "starter";
    if (placement) {
      const catResult = placement.categoryResults.find((c) => c.categoryId === categoryId);
      if (catResult && catResult.level) {
        initialLevel = catResult.level;
      }
    }
    progress = new CategoryProgress({
      childId,
      categoryId,
      level: initialLevel,
      xp: 0,
      quizzesCompleted: 0,
    });
    await progress.save();
  }

  // 2. Map level to difficulty
  let difficulty = "easy";
  if (progress.level === "explorer") difficulty = "medium";
  if (progress.level === "champion") difficulty = "hard";

  // 3. Fetch 5 random questions (avoiding attempted ones first)
  let questions = await QuizQuestion.aggregate([
    {
      $match: {
        category: categoryId,
        ageGroup: ageGroup,
        difficulty: difficulty,
        _id: { $nin: progress.attemptedQuestionIds }
      }
    },
    { $sample: { size: 5 } }
  ]);

  // 4. Fallback if not enough questions — allow re-attempting old questions
  if (questions.length < 5) {
    const existingIds = questions.map((q: any) => q._id);
    const diff = 5 - questions.length;
    const fallbackQuestions = await QuizQuestion.aggregate([
      {
        $match: {
          category: categoryId,
          ageGroup: ageGroup,
          difficulty: difficulty,
          _id: { $nin: existingIds } // avoid duplicates in this set
        }
      },
      { $sample: { size: diff } }
    ]);
    questions = [...questions, ...fallbackQuestions];
  }

  // 5. If still < 5, try fetching from any difficulty in same category
  if (questions.length < 5) {
    const existingIds = questions.map((q: any) => q._id);
    const diff = 5 - questions.length;
    const anyDiffQuestions = await QuizQuestion.aggregate([
      {
        $match: {
          category: categoryId,
          ageGroup: ageGroup,
          _id: { $nin: existingIds }
        }
      },
      { $sample: { size: diff } }
    ]);
    questions = [...questions, ...anyDiffQuestions];
  }
  
  // What if there are literally < 5 questions in total? We just give what we have.

  // 6. Hide correct answers from client payload and build answer map
  const correctAnswers: Record<string, string> = {};
  const clientQuestions = questions.map((q) => {
    correctAnswers[q._id.toString()] = q.correctAnswer;
    return {
      _id: q._id,
      questionText: q.questionText,
      type: q.type,
      category: q.category,
      difficulty: q.difficulty,
      options: q.options,
    };
  });

  return {
    questions: clientQuestions,
    correctAnswers,
    progress: {
      level: progress.level,
      xp: progress.xp,
      xpToNextLevel: 50,
      quizzesCompleted: progress.quizzesCompleted,
    }
  };
}

// ── Submit Quiz ──────────────────────────────────────────────────────────────
export async function submitQuiz(childId: string, categoryId: string, answers: QuizAnswer[]) {
  const child = await User.findById(childId);
  if (!child) throw new Error("Child not found");

  const progress = await CategoryProgress.findOne({ childId, categoryId });
  if (!progress) throw new Error("Quiz progress not found. Start a quiz first.");

  // Evaluate answers
  const questionIds = answers.map((a) => a.questionId);
  const questions = await QuizQuestion.find({ _id: { $in: questionIds } });
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let correctCount = 0;

  for (const a of answers) {
    const q = questionMap.get(a.questionId.toString());
    if (q) {
      // Record attempt
      if (!progress.attemptedQuestionIds.includes(q._id)) {
        progress.attemptedQuestionIds.push(q._id);
      }

      // Check correctness
      if (q.type === "input") {
        if (q.correctAnswer.trim().toLowerCase() === (a.selectedAnswer || "").trim().toLowerCase()) {
          correctCount++;
        }
      } else {
        if (q.correctAnswer === a.selectedAnswer) {
          correctCount++;
        }
      }
    }
  }

  const limit = Math.max(answers.length, 1);
  const score = Math.round((correctCount / limit) * 100);
  const passed = score >= 75;

  let levelUp = false;
  let newLevel = progress.level;
  let gemsEarned = 0;
  let xpGained = 0;
  let newBadge = false;

  const isChampion = progress.level === "champion";

  // Increment quizzes completed
  progress.quizzesCompleted = (progress.quizzesCompleted || 0) + 1;

  if (isChampion) {
    // ── CHAMPION MODE: different reward logic ──
    if (passed) {
      // +20 XP to totalXP only (NO categoryXP, NO level progression)
      child.totalXP = (child.totalXP || 0) + 20;
      xpGained = 20;

      // +2 gems for champion pass
      gemsEarned = 2;

      // Track champion wins
      const oldWins = progress.championWins || 0;
      progress.championWins = oldWins + 1;

      // Check if they earned a new badge
      const oldBadge = getChampionBadge(oldWins).current;
      const newBadgeInfo = getChampionBadge(progress.championWins);
      if (newBadgeInfo.current !== oldBadge) {
        newBadge = true;
      }
    }
  } else {
    // ── STARTER / EXPLORER: normal progression ──
    if (passed) {
      // categoryXP: used ONLY for level progression
      progress.xp += 10;

      // totalXP: cumulative, never reset
      child.totalXP = (child.totalXP || 0) + 10;
      xpGained = 10;

      // +1 gem for passing
      gemsEarned += 1;

      // Level Up check: categoryXP reaches 50
      if (progress.xp >= 50) {
        if (progress.level === "starter") {
          newLevel = "explorer";
          levelUp = true;
        } else if (progress.level === "explorer") {
          newLevel = "champion";
          levelUp = true;
        }

        if (levelUp) {
          progress.level = newLevel;
          progress.xp = 0; // reset categoryXP for next level
          progress.quizzesCompleted = 0;
        }
      }
    }

    // Every 5 quizzes → +2 gems (starter/explorer only)
    if (progress.quizzesCompleted > 0 && progress.quizzesCompleted % 5 === 0) {
      gemsEarned += 2;
    }
  }

  // Apply gems
  if (gemsEarned > 0) {
    child.gems = (child.gems || 0) + gemsEarned;
  }

  await child.save();
  await progress.save();

  const badgeInfo = getChampionBadge(progress.championWins || 0);

  return {
    score,
    passed,
    levelUp,
    newLevel: progress.level,
    newXP: progress.xp,
    xpToNextLevel: 50,
    totalXP: child.totalXP,
    gemsEarned,
    totalGems: child.gems,
    quizzesCompleted: progress.quizzesCompleted,
    correctCount,
    totalQuestions: answers.length,
    // Champion-specific fields
    isChampion,
    championWins: progress.championWins || 0,
    championBadge: badgeInfo,
    newBadge,
  };
}

// ── Get Category Progress ────────────────────────────────────────────────────
export async function getCategoryProgress(childId: string, categoryId: string) {
  let progress = await CategoryProgress.findOne({ childId, categoryId });
  
  if (!progress) {
    // Attempt to initialize from PlacementResult
    const placement = await PlacementResult.findOne({ childId });
    let initialLevel = "starter";
    if (placement) {
      const catResult = placement.categoryResults.find((c) => c.categoryId === categoryId);
      if (catResult && catResult.level) {
        initialLevel = catResult.level;
      }
    }
    progress = new CategoryProgress({
      childId,
      categoryId,
      level: initialLevel,
      xp: 0,
      quizzesCompleted: 0,
      championWins: 0,
    });
    await progress.save();
  }

  return {
    categoryId: progress.categoryId,
    level: progress.level,
    xp: progress.xp,
    xpToNextLevel: 50,
    quizzesCompleted: progress.quizzesCompleted,
    questionsAttempted: progress.attemptedQuestionIds.length,
    championWins: progress.championWins || 0,
    championBadge: getChampionBadge(progress.championWins || 0),
  };
}

// ── Champion Badge Logic ─────────────────────────────────────────────────────
function getChampionBadge(wins: number): { current: string; next: string; winsToNext: number } {
  if (wins >= 50) return { current: "master", next: "max", winsToNext: 0 };
  if (wins >= 30) return { current: "gold", next: "master", winsToNext: 50 - wins };
  if (wins >= 15) return { current: "silver", next: "gold", winsToNext: 30 - wins };
  if (wins >= 5) return { current: "bronze", next: "silver", winsToNext: 15 - wins };
  return { current: "none", next: "bronze", winsToNext: 5 - wins };
}
