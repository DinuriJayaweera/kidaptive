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

  // Increment quizzes completed
  progress.quizzesCompleted = (progress.quizzesCompleted || 0) + 1;

  if (passed) {
    // ── categoryXP: used ONLY for level progression ──
    progress.xp += 10;

    // ── totalXP: cumulative, never reset ──
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
      // Champion stays champion but keeps earning XP
      
      if (levelUp) {
        progress.level = newLevel;
        progress.xp = 0; // reset categoryXP for next level
        progress.quizzesCompleted = 0; // reset quiz count for new level
      }
    }
  }

  // Every 5 quizzes → +2 gems (regardless of pass/fail, based on completion count)
  if (progress.quizzesCompleted > 0 && progress.quizzesCompleted % 5 === 0) {
    gemsEarned += 2;
  }

  // Apply gems
  if (gemsEarned > 0) {
    child.gems = (child.gems || 0) + gemsEarned;
  }

  await child.save();
  await progress.save();

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
  };
}
