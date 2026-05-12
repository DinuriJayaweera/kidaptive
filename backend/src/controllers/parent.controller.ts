import { Request, Response } from "express";
import User, { IUser } from "../models/User.js";
import CategoryProgress from "../models/categoryProgress.model.js";
import PlacementResult from "../models/placementResult.model.js";
import ActivityLog from "../models/activityLog.model.js";
import DailyQuestCompletion from "../models/dailyQuestCompletion.model.js";
import ChildSession from "../models/childSession.model.js";
import {
    getParentProfile,
    updateParentProfile,
    updateParentAvatar,
    deleteParentAccount,
    changeParentPassword,
} from "../services/parent-profile.service.js";

// Utility to get child enhanced structure
async function getChildEnhancedData(child: IUser, includePlacement = false) {
  const categories = await CategoryProgress.find({ childId: child._id });
  const placement = await PlacementResult.findOne({ childId: child._id });

  // Build a map of all categories from CategoryProgress (source of truth for XP)
  const categoryMap = new Map<string, any>();
  for (const cat of categories) {
    // progress.xp resets to 0 on level-up, so compute REAL total XP:
    // Starter→Explorer = 50 XP, Explorer→Champion = 50 XP more
    // Champion wins = 20 XP each (added to totalXP but not progress.xp)
    let earnedXp = cat.xp || 0; // current partial XP towards next level
    if (cat.level === "explorer") earnedXp += 50;       // already passed starter (50 XP)
    if (cat.level === "champion") earnedXp += 100;      // passed starter (50) + explorer (50)
    earnedXp += (cat.championWins || 0) * 20;           // champion mode XP

    categoryMap.set(cat.categoryId, {
      categoryId: cat.categoryId,
      level: cat.level,
      xp: earnedXp,
      xpToNextLevel: getXpThresholdForLevel(cat.level),
      quizzesCompleted: cat.globalQuizzesCompleted || cat.quizzesCompleted || 0,
      championWins: cat.championWins || 0,
    });
  }

  // Merge categories from placement test that don't have a CategoryProgress yet
  if (placement && placement.placementCompleted) {
    for (const cr of placement.categoryResults) {
      if (!categoryMap.has(cr.categoryId)) {
        categoryMap.set(cr.categoryId, {
          categoryId: cr.categoryId,
          level: cr.level,
          xp: 0,
          xpToNextLevel: getXpThresholdForLevel(cr.level),
          quizzesCompleted: 0,
        });
      }
    }
  }

  const allCategories = Array.from(categoryMap.values());

  // Compute real totals from all categories
  const computedXP = allCategories.reduce((sum: number, cat: any) => sum + (cat.xp || 0), 0);
  const totalXP = Math.max(child.totalXP || 0, computedXP);

  const base: any = {
    childId: child._id,
    name: child.name,
    age: child.age,
    avatar: child.avatar,
    totalXP,
    gems: child.gems || 0,
    streak: child.streak || 0,
    lastPlayedDate: child.lastPlayedDate || null,
    createdAt: child.createdAt,
    categories: allCategories,
  };

  // Optionally include placement test results
  if (includePlacement) {
    if (placement && placement.placementCompleted) {
      base.placementCompleted = true;
      base.placementResults = placement.categoryResults.map((cr: any) => ({
        categoryId: cr.categoryId,
        score: cr.score,
        assignedLevel: cr.level,
      }));
    } else {
      base.placementCompleted = false;
      base.placementResults = [];
    }
  }

  return base;
}

// XP thresholds for each level advancement
function getXpThresholdForLevel(level: string): number {
  switch (level) {
    case "starter": return 100;
    case "explorer": return 250;
    case "champion": return 500;
    default: return 100;
  }
}

// ── GET /parent/children ──
export const getParentChildren = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;
    const children = await User.find({ parentId, role: "child" });

    const enhancedChildren = await Promise.all(
      children.map((child: any) => getChildEnhancedData(child))
    );

    res.json(enhancedChildren);
  } catch (error) {
    console.error("Error in getParentChildren:", error);
    res.status(500).json({ message: "Failed to load children." });
  }
};

// ── GET /parent/child/:id/progress ──
export const getChildProgress = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;
    const { id } = req.params;

    const child = await User.findOne({ _id: id, parentId, role: "child" });
    if (!child) {
      return res.status(404).json({ message: "Child not found." });
    }

    const enhancedChild = await getChildEnhancedData(child, true);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const todayDateStr = now.toISOString().split('T')[0];
    const weekStartDateStr = startOfWeek.toISOString().split('T')[0];

    const [todayLogs, weekLogs, recentLogs, todayQuest, weekQuests, totalQuestCount, recentQuests, todaySessions, weekSessions] = await Promise.all([
      ActivityLog.find({ childId: child._id, createdAt: { $gte: startOfToday } }).sort({ createdAt: 1 }),
      ActivityLog.find({ childId: child._id, createdAt: { $gte: startOfWeek } }),
      ActivityLog.find({ childId: child._id }).sort({ createdAt: -1 }).limit(12),
      DailyQuestCompletion.findOne({ childId: child._id, date: todayDateStr, completed: true }),
      DailyQuestCompletion.find({ childId: child._id, date: { $gte: weekStartDateStr }, completed: true }),
      DailyQuestCompletion.countDocuments({ childId: child._id, completed: true }),
      DailyQuestCompletion.find({ childId: child._id, completed: true }).sort({ createdAt: -1 }).limit(10),
      ChildSession.find({ childId: child._id, date: todayDateStr }).sort({ sessionStart: 1 }),
      ChildSession.find({ childId: child._id, date: { $gte: weekStartDateStr } }),
    ]);

    // Screen time from real session data (heartbeat-based)
    // Grace: count up to 45 s after the last heartbeat to cover the final interval
    const HEARTBEAT_GRACE_MS = 45_000;
    const nowMs = Date.now();
    const sessionSeconds = (session: any) =>
      Math.max(0, Math.round(
        (Math.min(session.lastHeartbeat.getTime() + HEARTBEAT_GRACE_MS, nowMs) - session.sessionStart.getTime()) / 1000,
      ));

    const totalLearningSecondsToday = todaySessions.reduce((sum, s) => sum + sessionSeconds(s), 0);
    const totalLearningSecondsWeek  = weekSessions.reduce((sum, s) => sum + sessionSeconds(s), 0);

    // Start/end times from sessions (first session start → last heartbeat today)
    const todayFirstSession = todaySessions[0] ?? null;
    const todayLastSession  = todaySessions.length ? todaySessions.reduce((latest, s) =>
      s.lastHeartbeat > latest.lastHeartbeat ? s : latest
    ) : null;

    const quizzesToday = todayLogs.filter((log) => log.type === "quiz_complete").length;
    const xpToday = todayLogs.reduce(
      (sum, log) => sum + (log.type === "xp_earned" ? (log.xp || 0) : 0),
      0,
    );

    const quizzesWeek = weekLogs.filter((log) => log.type === "quiz_complete").length;

    const practiceCounts = weekLogs
      .filter((log) => log.type === "quiz_complete" && log.categoryId)
      .reduce((acc, log) => {
        const key = log.categoryId as string;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const mostPracticedCategory = Object.keys(practiceCounts).length
      ? Object.entries(practiceCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    const bestScoreThisWeek = weekLogs
      .filter((log) => log.type === "quiz_complete" && typeof log.score === "number")
      .reduce((max, log) => Math.max(max, log.score as number), -1);

    // Merge ActivityLog + DailyQuestCompletion entries into a single timeline
    const questTimelineEntries = recentQuests.map((q) => ({
      id: `quest-${q._id.toString()}`,
      time: q.createdAt.toISOString(),
      description: `Daily Quest completed — Score: ${q.score}%, earned +${q.xpEarned} XP and +${q.gemsEarned} Gems`,
    }));

    const mergedTimeline = [
      ...recentLogs.map((log) => ({
        id: log._id.toString(),
        time: log.createdAt.toISOString(),
        description: log.description,
      })),
      ...questTimelineEntries,
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 12);

    const activitySummary = {
      today: {
        startTime: todayFirstSession?.sessionStart.toISOString() ?? null,
        endTime: todayLastSession?.lastHeartbeat.toISOString() ?? null,
        totalLearningSeconds: totalLearningSecondsToday,
        quizzesCompleted: quizzesToday,
        xpEarned: xpToday,
      },
      weekly: {
        totalLearningSeconds: totalLearningSecondsWeek,
        quizzesCompleted: quizzesWeek,
        streak: child.streak || 0,
      },
      insights: {
        mostPracticedCategory,
        bestScoreThisWeek: bestScoreThisWeek >= 0 ? bestScoreThisWeek : null,
        averageDailyLearningSeconds: Math.round(totalLearningSecondsWeek / 7),
      },
      timeline: mergedTimeline,
      dailyQuestSummary: {
        todayCompleted: !!todayQuest,
        todayScore: todayQuest?.score,
        todayXP: todayQuest?.xpEarned,
        todayGems: todayQuest?.gemsEarned,
        weeklyCompleted: weekQuests.length,
        totalCompleted: totalQuestCount,
      },
    };

    res.json({
      ...enhancedChild,
      activitySummary,
    });
  } catch (error) {
    console.error("Error in getChildProgress:", error);
    res.status(500).json({ message: "Failed to load child progress." });
  }
};

// ── PUT /parent/child/:id ── Edit child profile
export const updateChild = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;
    const { id } = req.params;
    const { name, age, avatar } = req.body;

    const child = await User.findOne({ _id: id, parentId, role: "child" });
    if (!child) {
      return res.status(404).json({ message: "Child not found." });
    }

    if (name !== undefined) child.name = name;
    if (age !== undefined) child.age = age;
    if (avatar !== undefined) child.avatar = avatar;

    await child.save();

    res.json({ message: "Child updated successfully.", child: { childId: child._id, name: child.name, age: child.age, avatar: child.avatar } });
  } catch (error) {
    console.error("Error in updateChild:", error);
    res.status(500).json({ message: "Failed to update child." });
  }
};

// ── DELETE /parent/child/:id ── Delete child and all related data
export const deleteChild = async (req: Request, res: Response) => {
  try {
    const parentId = (req as any).user.userId;
    const { id } = req.params;

    const child = await User.findOne({ _id: id, parentId, role: "child" });
    if (!child) {
      return res.status(404).json({ message: "Child not found." });
    }

    // Delete related data
    await CategoryProgress.deleteMany({ childId: child._id });
    await PlacementResult.deleteMany({ childId: child._id });
    await ActivityLog.deleteMany({ childId: child._id });
    await DailyQuestCompletion.deleteMany({ childId: child._id });
    await ChildSession.deleteMany({ childId: child._id });
    await User.deleteOne({ _id: child._id });

    res.json({ message: "Child deleted successfully." });
  } catch (error) {
    console.error("Error in deleteChild:", error);
    res.status(500).json({ message: "Failed to delete child." });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PARENT PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /parent/profile ──
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const profile = await getParentProfile(userId);
    res.json(profile);
  } catch (error: any) {
    console.error("Error in getProfile:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to load profile." });
  }
};

// ── PATCH /parent/profile ──
export const patchProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const result = await updateParentProfile(userId, req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Error in patchProfile:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update profile." });
  }
};

// ── POST /parent/avatar ──
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Support base64 uploads
    const { avatarData } = req.body;
    if (!avatarData || typeof avatarData !== "string") {
      return res.status(400).json({ message: "Avatar data is required (base64 string)." });
    }

    // Store as data URL directly in DB (for simplicity without cloud storage)
    const result = await updateParentAvatar(userId, avatarData);
    res.json(result);
  } catch (error: any) {
    console.error("Error in uploadAvatar:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to upload avatar." });
  }
};

// ── POST /parent/change-password ──
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }

    const result = await changeParentPassword(userId, { currentPassword, newPassword });
    res.json(result);
  } catch (error: any) {
    console.error("Error in changePassword:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to change password." });
  }
};

// ── DELETE /parent/account ──
export const removeAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { confirmation } = req.body;
    const result = await deleteParentAccount(userId, confirmation);
    res.json(result);
  } catch (error: any) {
    console.error("Error in removeAccount:", error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to delete account." });
  }
};
