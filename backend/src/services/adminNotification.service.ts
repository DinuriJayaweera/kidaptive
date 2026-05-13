import AdminNotification from '../models/adminNotification.model.js';
import QuizQuestion from '../models/quizQuestion.model.js';
import DailyQuestQuestion from '../models/dailyQuest.model.js';
import ActivityLog from '../models/activityLog.model.js';

const QUIZ_LOW_THRESHOLD       = 50;
const DAILY_QUEST_LOW_THRESHOLD = 30;
const HIGH_ACTIVITY_THRESHOLD  = 50; // quiz completions per hour

export async function createAdminNotification(
  type: string,
  title: string,
  message: string,
  icon = '🔔',
): Promise<void> {
  await AdminNotification.create({ type, title, message, icon, read: false });
}

export async function checkQuestionBanks(): Promise<void> {
  try {
    const cooldown = new Date(Date.now() - 24 * 3_600_000);

    const [quizCount, dqCount, recentQuizAlert, recentDqAlert] = await Promise.all([
      QuizQuestion.countDocuments(),
      DailyQuestQuestion.countDocuments(),
      AdminNotification.findOne({ type: 'question_bank_low',  createdAt: { $gte: cooldown } }),
      AdminNotification.findOne({ type: 'daily_quest_low',    createdAt: { $gte: cooldown } }),
    ]);

    if (quizCount < QUIZ_LOW_THRESHOLD && !recentQuizAlert) {
      await createAdminNotification(
        'question_bank_low',
        '⚠️ Quiz Question Bank Running Low',
        `Only ${quizCount} quiz questions remain. Add more to maintain variety for learners.`,
        '⚠️',
      );
    }

    if (dqCount < DAILY_QUEST_LOW_THRESHOLD && !recentDqAlert) {
      await createAdminNotification(
        'daily_quest_low',
        '⚠️ Daily Quest Questions Running Low',
        `Only ${dqCount} daily quest questions available. Add more to ensure children get varied quests.`,
        '⚠️',
      );
    }
  } catch (err) {
    console.error('checkQuestionBanks error (non-fatal):', err);
  }
}

export async function checkHighActivity(): Promise<void> {
  try {
    const oneHourAgo  = new Date(Date.now() - 3_600_000);
    const cooldown    = new Date(Date.now() - 6 * 3_600_000);

    const [count, recentAlert] = await Promise.all([
      ActivityLog.countDocuments({ type: 'quiz_complete', createdAt: { $gte: oneHourAgo } }),
      AdminNotification.findOne({ type: 'high_activity', createdAt: { $gte: cooldown } }),
    ]);

    if (count >= HIGH_ACTIVITY_THRESHOLD && !recentAlert) {
      await createAdminNotification(
        'high_activity',
        '🔥 High Platform Activity',
        `${count} quizzes completed in the last hour — the platform is experiencing peak usage.`,
        '🔥',
      );
    }
  } catch (err) {
    console.error('checkHighActivity error (non-fatal):', err);
  }
}
