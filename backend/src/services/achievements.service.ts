import mongoose from "mongoose";
import Achievement from "../models/achievement.model.js";
import User from "../models/User.js";
import PlacementResult from "../models/placementResult.model.js";
import CategoryProgress from "../models/categoryProgress.model.js";
import Mistake from "../models/mistake.model.js";
import ActivityLog from "../models/activityLog.model.js";

/**
 * Achievements service — WITH champion sub-badges.
 *
 * Added 4 new achievements for champion milestone wins:
 * - Champion Bronze (5 wins)
 * - Champion Silver (15 wins)
 * - Champion Gold (30 wins)
 * - Champion Master (50 wins)
 *
 * These unlock based on championWins ACROSS ALL CATEGORIES (cumulative).
 */

// ── Types ──────────────────────────────────────────────────────────────────
export type AchievementCategory =
    | "placement"
    | "streak"
    | "quiz"
    | "gem"
    | "accuracy"
    | "champion_badges"  // NEW category
    | "special";

export interface AchievementProgress {
    current: number;
    target: number;
}

export interface AchievementDef {
    key: string;
    title: string;
    description: string;
    icon: string;
    category: AchievementCategory;
}

export interface AchievementWithStatus extends AchievementDef {
    unlocked: boolean;
    unlockedAt: Date | null;
    progress: AchievementProgress;
}

interface ChildSnapshot {
    childId: string;
    age: number;
    streak: number;
    gems: number;
    placementCompleted: boolean;
    hasStarterLevel: boolean;
    hasEarnedExplorer: boolean;
    hasEarnedChampion: boolean;
    levelsAchieved: Set<string>;
    quizzesCompleted: number;
    perfectQuizzes: number;
    everLeveledUp: boolean;
    fixedMistakes: number;
    assignedCategories: string[];
    totalChampionWins: number;  // NEW — sum across all categories
}

// ── The Catalog ────────────────────────────────────────────────────────────
export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
    {
        key: "first_crown",
        title: "First Crown",
        description: "Complete the placement test",
        icon: "👑",
        category: "placement",
    },
    {
        key: "starter_crown",
        title: "Starter Crown",
        description: "Reach Starter level in any category",
        icon: "🥉",
        category: "placement",
    },
    {
        key: "explorer_crown",
        title: "Explorer Crown",
        description: "Earn Explorer level through quiz progression",
        icon: "🥈",
        category: "placement",
    },
    {
        key: "champion_crown",
        title: "Champion Crown",
        description: "Earn Champion level through quiz progression",
        icon: "🥇",
        category: "placement",
    },

    // 🔥 STREAK
    {
        key: "on_fire",
        title: "On Fire",
        description: "Reach a 7-day learning streak",
        icon: "🔥",
        category: "streak",
    },
    {
        key: "super_flame",
        title: "Super Flame",
        description: "Reach a 14-day learning streak",
        icon: "🔥🔥",
        category: "streak",
    },
    {
        key: "unstoppable",
        title: "Unstoppable",
        description: "Reach a 30-day learning streak",
        icon: "🚀",
        category: "streak",
    },

    // ⭐ QUIZ
    {
        key: "first_star",
        title: "First Star",
        description: "Complete your first quiz",
        icon: "⭐",
        category: "quiz",
    },
    {
        key: "quiz_explorer",
        title: "Quiz Explorer",
        description: "Complete 10 quizzes",
        icon: "🌟",
        category: "quiz",
    },
    {
        key: "lesson_hero",
        title: "Lesson Hero",
        description: "Complete 50 quizzes",
        icon: "🏆",
        category: "quiz",
    },

    // 💎 GEM
    {
        key: "gem_collector",
        title: "Gem Collector",
        description: "Earn 1,000 gems in total",
        icon: "💎",
        category: "gem",
    },
    {
        key: "treasure_master",
        title: "Treasure Master",
        description: "Earn 5,000 gems in total",
        icon: "💰",
        category: "gem",
    },

    // 🎯 ACCURACY
    {
        key: "perfect_shot",
        title: "Perfect Shot",
        description: "Get 100% on a quiz",
        icon: "🎯",
        category: "accuracy",
    },
    {
        key: "sharp_thinker",
        title: "Sharp Thinker",
        description: "Get 100% on 5 quizzes",
        icon: "🧠",
        category: "accuracy",
    },

    // 🏅 CHAMPION BADGES — NEW
    {
        key: "champion_bronze",
        title: "Champion Bronze",
        description: "Win 5 champion-level quizzes",
        icon: "🥉",
        category: "champion_badges",
    },
    {
        key: "champion_silver",
        title: "Champion Silver",
        description: "Win 15 champion-level quizzes",
        icon: "🥈",
        category: "champion_badges",
    },
    {
        key: "champion_gold",
        title: "Champion Gold",
        description: "Win 30 champion-level quizzes",
        icon: "🥇",
        category: "champion_badges",
    },
    {
        key: "champion_master",
        title: "Champion Master",
        description: "Win 50 champion-level quizzes",
        icon: "👑",
        category: "champion_badges",
    },

    // 🏆 SPECIAL
    {
        key: "level_up_hero",
        title: "Level Up Hero",
        description: "Level up in any category",
        icon: "📈",
        category: "special",
    },
    {
        key: "champion_legend",
        title: "Champion Legend",
        description: "Reach Champion in every category for your age",
        icon: "👑",
        category: "special",
    },
    {
        key: "mistake_master",
        title: "Mistake Master",
        description: "Fix 20 mistakes in Mistakes mode",
        icon: "✅",
        category: "special",
    },
];

const EVALUATORS: Record<string, (s: ChildSnapshot) => AchievementProgress> = {
    first_crown: (s) => ({ current: s.placementCompleted ? 1 : 0, target: 1 }),
    starter_crown: (s) => ({ current: s.hasStarterLevel ? 1 : 0, target: 1 }),
    explorer_crown: (s) => ({ current: s.hasEarnedExplorer ? 1 : 0, target: 1 }),
    champion_crown: (s) => ({ current: s.hasEarnedChampion ? 1 : 0, target: 1 }),

    on_fire: (s) => ({ current: Math.min(s.streak, 7), target: 7 }),
    super_flame: (s) => ({ current: Math.min(s.streak, 14), target: 14 }),
    unstoppable: (s) => ({ current: Math.min(s.streak, 30), target: 30 }),

    first_star: (s) => ({ current: Math.min(s.quizzesCompleted, 1), target: 1 }),
    quiz_explorer: (s) => ({ current: Math.min(s.quizzesCompleted, 10), target: 10 }),
    lesson_hero: (s) => ({ current: Math.min(s.quizzesCompleted, 50), target: 50 }),

    gem_collector: (s) => ({ current: Math.min(s.gems, 1000), target: 1000 }),
    treasure_master: (s) => ({ current: Math.min(s.gems, 5000), target: 5000 }),

    perfect_shot: (s) => ({ current: Math.min(s.perfectQuizzes, 1), target: 1 }),
    sharp_thinker: (s) => ({ current: Math.min(s.perfectQuizzes, 5), target: 5 }),

    // Champion badges — cumulative wins across all categories
    champion_bronze: (s) => ({ current: Math.min(s.totalChampionWins, 5), target: 5 }),
    champion_silver: (s) => ({ current: Math.min(s.totalChampionWins, 15), target: 15 }),
    champion_gold: (s) => ({ current: Math.min(s.totalChampionWins, 30), target: 30 }),
    champion_master: (s) => ({ current: Math.min(s.totalChampionWins, 50), target: 50 }),

    level_up_hero: (s) => ({ current: s.everLeveledUp ? 1 : 0, target: 1 }),
    champion_legend: (s) => {
        if (s.assignedCategories.length === 0) {
            return { current: 0, target: 1 };
        }
        const championed = s.assignedCategories.filter((cat) =>
            s.levelsAchieved.has(`${cat}:champion`),
        );
        return {
            current: championed.length,
            target: s.assignedCategories.length,
        };
    },
    mistake_master: (s) => ({
        current: Math.min(s.fixedMistakes, 20),
        target: 20,
    }),
};

// ── Snapshot builder ───────────────────────────────────────────────────────
async function buildSnapshot(childId: string): Promise<ChildSnapshot> {
    const childObjectId = new mongoose.Types.ObjectId(childId);

    const [child, placement, allProgress, fixedMistakeCount] = await Promise.all([
        User.findById(childId).select(
            "age streak gems placementCompleted perfectQuizzes everLeveledUp",
        ),
        PlacementResult.findOne({ childId: childObjectId }),
        CategoryProgress.find({ childId: childObjectId }),
        Mistake.countDocuments({ childId: childObjectId, resolved: true }),
    ]);

    if (!child) {
        return {
            childId,
            age: 0,
            streak: 0,
            gems: 0,
            placementCompleted: false,
            hasStarterLevel: false,
            hasEarnedExplorer: false,
            hasEarnedChampion: false,
            levelsAchieved: new Set(),
            quizzesCompleted: 0,
            perfectQuizzes: 0,
            everLeveledUp: false,
            fixedMistakes: 0,
            assignedCategories: [],
            totalChampionWins: 0,
        };
    }

    let hasStarterLevel = false;
    let hasEarnedExplorer = false;
    let hasEarnedChampion = false;
    const levelsAchieved = new Set<string>();
    let quizzesCompletedFromProgress = 0;
    let everLeveledUpFromProgress = false;
    let totalChampionWins = 0;

    for (const p of allProgress) {
        hasStarterLevel = true;

        if (p.earnedLevels?.includes("explorer")) {
            hasEarnedExplorer = true;
        }
        if (p.earnedLevels?.includes("champion")) {
            hasEarnedChampion = true;
        }

        levelsAchieved.add(`${p.categoryId}:${p.level}`);
        quizzesCompletedFromProgress += p.globalQuizzesCompleted || 0;
        totalChampionWins += p.championWins || 0;

        if (
            p.level === "explorer" ||
            p.level === "champion" ||
            (p.championWins || 0) > 0
        ) {
            everLeveledUpFromProgress = true;
        }
    }

    let quizzesCompleted = quizzesCompletedFromProgress;
    try {
        const activityCount = await ActivityLog.countDocuments({
            childId: childObjectId,
            type: "quiz_complete",
        });
        if (activityCount > quizzesCompleted) {
            quizzesCompleted = activityCount;
        }
    } catch {
        // non-fatal
    }

    const assignedCategories =
        placement?.categoryResults.map((r) => r.categoryId) ?? [];

    return {
        childId,
        age: child.age || 0,
        streak: child.streak || 0,
        gems: child.gems || 0,
        placementCompleted: child.placementCompleted ?? false,
        hasStarterLevel,
        hasEarnedExplorer,
        hasEarnedChampion,
        levelsAchieved,
        quizzesCompleted,
        perfectQuizzes: (child as any).perfectQuizzes || 0,
        everLeveledUp:
            ((child as any).everLeveledUp ?? false) || everLeveledUpFromProgress,
        fixedMistakes: fixedMistakeCount,
        assignedCategories,
        totalChampionWins,
    };
}

// ── Public API ─────────────────────────────────────────────────────────────
export async function evaluateAchievements(
    childId: string,
): Promise<string[]> {
    const snapshot = await buildSnapshot(childId);
    const existing = await Achievement.find({ childId }).select("achievementKey");
    const alreadyUnlocked = new Set(existing.map((a) => a.achievementKey));
    const newlyUnlocked: string[] = [];

    for (const def of ACHIEVEMENT_CATALOG) {
        if (alreadyUnlocked.has(def.key)) continue;
        const evaluator = EVALUATORS[def.key];
        if (!evaluator) continue;

        const { current, target } = evaluator(snapshot);
        if (current >= target && target > 0) {
            try {
                await Achievement.create({
                    childId: new mongoose.Types.ObjectId(childId),
                    achievementKey: def.key,
                    unlockedAt: new Date(),
                });
                newlyUnlocked.push(def.key);
            } catch (err: any) {
                if (err.code !== 11000) {
                    console.error(
                        `Failed to unlock achievement ${def.key} for ${childId}:`,
                        err,
                    );
                }
            }
        }
    }

    return newlyUnlocked;
}

export async function getAchievementsForChild(
    childId: string,
): Promise<{
    achievements: AchievementWithStatus[];
    summary: { unlocked: number; total: number };
    newlyUnlocked: string[];
}> {
    const newlyUnlocked = await evaluateAchievements(childId);
    const snapshot = await buildSnapshot(childId);
    const unlockedDocs = await Achievement.find({ childId });
    const unlockMap = new Map(
        unlockedDocs.map((d) => [d.achievementKey, d.unlockedAt]),
    );

    const achievements: AchievementWithStatus[] = ACHIEVEMENT_CATALOG.map((def) => {
        const evaluator = EVALUATORS[def.key];
        const progress = evaluator
            ? evaluator(snapshot)
            : { current: 0, target: 1 };
        const unlockedAt = unlockMap.get(def.key) ?? null;
        return {
            ...def,
            unlocked: !!unlockedAt,
            unlockedAt,
            progress,
        };
    });

    return {
        achievements,
        summary: {
            unlocked: achievements.filter((a) => a.unlocked).length,
            total: achievements.length,
        },
        newlyUnlocked,
    };
}

export async function recordQuizSideEffects(
    childId: string,
    opts: { perfect: boolean; leveledUp: boolean },
): Promise<void> {
    const update: Record<string, unknown> = {};
    if (opts.perfect) {
        update.$inc = { perfectQuizzes: 1 };
    }
    if (opts.leveledUp) {
        update.$set = { everLeveledUp: true };
    }
    if (Object.keys(update).length > 0) {
        await User.updateOne({ _id: childId }, update);
    }
}

export async function backfillAllChildren(): Promise<{
    childrenProcessed: number;
    totalUnlocked: number;
}> {
    const children = await User.find({ role: "child" }).select("_id");
    let totalUnlocked = 0;
    for (const child of children) {
        const newlyUnlocked = await evaluateAchievements(child._id.toString());
        totalUnlocked += newlyUnlocked.length;
    }
    return {
        childrenProcessed: children.length,
        totalUnlocked,
    };
}
