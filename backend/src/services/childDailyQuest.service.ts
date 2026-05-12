import mongoose from 'mongoose';
import User from '../models/User.js';
import DailyQuestQuestion from '../models/dailyQuest.model.js';
import DailyQuestCompletion from '../models/dailyQuestCompletion.model.js';
import ActivityLog from '../models/activityLog.model.js';

interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  timeTaken?: number;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Today Status ─────────────────────────────────────────────────────────────
export async function getTodayStatus(childId: string) {
  const today = getTodayDate();
  const completion = await DailyQuestCompletion.findOne({ childId, date: today });

  if (completion?.completed) {
    return {
      status: 'completed' as const,
      completion: {
        score:        completion.score,
        correctCount: completion.correctCount,
        xpEarned:     completion.xpEarned,
        gemsEarned:   completion.gemsEarned,
      },
    };
  }

  return { status: 'available' as const };
}

// ── Start Daily Quest ─────────────────────────────────────────────────────────
export async function startDailyQuest(childId: string) {
  const today = getTodayDate();

  const existing = await DailyQuestCompletion.findOne({ childId, date: today });
  if (existing?.completed) {
    throw new Error('Daily quest already completed today.');
  }

  const child = await User.findById(childId);
  if (!child) throw new Error('Child not found');
  const ageGroup = child.age ? `${child.age}-${child.age + 1}` : '5-6';

  // Collect all question IDs the child has done in past daily quests
  const pastCompletions = await DailyQuestCompletion.find({ childId });
  const attemptedIds = pastCompletions.flatMap((c) =>
    c.questionIds.map((id) => new mongoose.Types.ObjectId(id.toString()))
  );

  // Try to get 10 unused questions for this ageGroup
  let questions = await DailyQuestQuestion.aggregate([
    { $match: { ageGroup, _id: { $nin: attemptedIds } } },
    { $sample: { size: 10 } },
  ]);

  // Fallback: fill remaining slots with any ageGroup questions not yet in this batch
  if (questions.length < 10) {
    const batchIds = questions.map((q: any) => q._id);
    const needed = 10 - questions.length;
    const fallback = await DailyQuestQuestion.aggregate([
      { $match: { ageGroup, _id: { $nin: batchIds } } },
      { $sample: { size: needed } },
    ]);
    questions = [...questions, ...fallback];
  }

  if (questions.length === 0) {
    throw new Error('No daily quest questions available for your age group.');
  }

  const correctAnswers: Record<string, string> = {};
  const clientQuestions = questions.map((q: any) => {
    correctAnswers[q._id.toString()] = q.correctAnswer;
    return {
      _id:          q._id,
      questionText: q.questionText,
      type:         q.type,
      category:     q.category,
      difficulty:   q.difficulty,
      options:      q.options,
    };
  });

  return {
    questions:      clientQuestions,
    correctAnswers,
    totalQuestions: clientQuestions.length,
  };
}

// ── Submit Daily Quest ────────────────────────────────────────────────────────
export async function submitDailyQuest(childId: string, answers: QuizAnswer[]) {
  const today = getTodayDate();

  const existing = await DailyQuestCompletion.findOne({ childId, date: today });
  if (existing?.completed) {
    throw new Error('Daily quest already completed today.');
  }

  const child = await User.findById(childId);
  if (!child) throw new Error('Child not found');

  const questionIds = answers.map((a) => a.questionId);
  const questions = await DailyQuestQuestion.find({ _id: { $in: questionIds } });
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let correctCount = 0;
  for (const a of answers) {
    const q = questionMap.get(a.questionId.toString());
    if (!q) continue;
    const isCorrect =
      q.type === 'input'
        ? q.correctAnswer.trim().toLowerCase() === (a.selectedAnswer || '').trim().toLowerCase()
        : q.correctAnswer === a.selectedAnswer;
    if (isCorrect) correctCount++;
  }

  const total = Math.max(answers.length, 10);
  const score = Math.round((correctCount / total) * 100);
  const passed = score >= 75;

  const xpEarned = Math.floor((score / 100) * 20);
  let gemsEarned = Math.floor((score / 100) * 100);
  if (score === 100) gemsEarned += 50;

  // Update totalXP and gems only — category XP and levels are untouched
  child.totalXP = (child.totalXP || 0) + xpEarned;
  child.gems    = (child.gems    || 0) + gemsEarned;
  await child.save();

  await DailyQuestCompletion.create({
    childId,
    date:         today,
    completed:    true,
    score,
    correctCount,
    xpEarned,
    gemsEarned,
    questionIds,
  });

  // Log to ActivityLog so screen time and quiz counts appear in the parent dashboard
  try {
    const durationSeconds = answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
    await ActivityLog.create({
      childId,
      type: 'quiz_complete',
      description: 'Completed Daily Quest',
      quizzes: 1,
      score,
      durationSeconds,
    });
    if (xpEarned > 0) {
      await ActivityLog.create({
        childId,
        type: 'xp_earned',
        description: `Earned ${xpEarned} XP from Daily Quest`,
        xp: xpEarned,
      });
    }
  } catch (logErr) {
    console.error('Daily quest activity log error (non-fatal):', logErr);
  }

  return {
    score,
    passed,
    correctCount,
    totalQuestions: answers.length,
    xpEarned,
    gemsEarned,
    totalXP:   child.totalXP,
    totalGems: child.gems,
  };
}
