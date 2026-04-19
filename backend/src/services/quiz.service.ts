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

  // 4. Fallback if not enough questions
  if (questions.length < 5) {
    const diff = 5 - questions.length;
    const fallbackQuestions = await QuizQuestion.aggregate([
      {
        $match: {
          category: categoryId,
          ageGroup: ageGroup,
          difficulty: difficulty,
          _id: { $in: progress.attemptedQuestionIds } // get from previously attempted
        }
      },
      { $sample: { size: diff } }
    ]);
    questions = [...questions, ...fallbackQuestions];
  }
  
  // What if there are literally < 5 questions in total? We just give what we have.

  // 5. Hide correct answers from client payload and build answer map
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
      xp: progress.xp
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

  if (passed) {
    progress.xp += 10;
    
    // Level Up check
    if (progress.xp >= 100) {
      if (progress.level === "starter") {
        newLevel = "explorer";
        levelUp = true;
      } else if (progress.level === "explorer") {
        newLevel = "champion";
        levelUp = true;
      }
      
      if (levelUp) {
        progress.level = newLevel;
        progress.xp = 0; // reset XP
      }
    }

    // Add general XP to User
    child.totalXP = (child.totalXP || 0) + 10;
    await child.save();
  }

  await progress.save();

  return {
    score,
    passed,
    levelUp,
    newLevel: progress.level,
    newXP: progress.xp,
    totalXP: child.totalXP
  };
}
