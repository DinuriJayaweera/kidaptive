import { Request, Response } from "express";
import User from "../models/User.js";
import CategoryProgress from "../models/categoryProgress.model.js";

// ── Age-group boundaries ───────────────────────────────────────────────────
const AGE_GROUPS = [
    { key: "5-6", min: 5, max: 6 },
    { key: "7-8", min: 7, max: 8 },
    { key: "9-10", min: 9, max: 10 },
] as const;

function getAgeGroup(age: number) {
    return AGE_GROUPS.find((g) => age >= g.min && age <= g.max) ?? null;
}

const MIN_LESSONS = 5; // lessons required to appear on leaderboard

// ── GET /child/leaderboard?scope=global ────────────────────────────────────
// scope=global → all eligible children across every age group
// scope=age-group (default) → only children in the current child's age bracket
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const currentChild = await User.findById(userId).select("age name avatar");

        if (!currentChild || !currentChild.age) {
            return res.status(400).json({ message: "Could not determine your age group." });
        }

        const scope = (req.query.scope as string) ?? "age-group";
        const isGlobal = scope === "global";
        const targetGroup = getAgeGroup(currentChild.age);

        // 1. Build the query — either age-filtered or all children
        const query: Record<string, any> = { role: "child" };
        if (!isGlobal && targetGroup) {
            query.age = { $gte: targetGroup.min, $lte: targetGroup.max };
        }

        const children = await User.find(query)
            .select("_id name avatar age totalXP gems streak")
            .lean();

        if (children.length === 0) {
            return res.json({
                scope,
                minLessons: MIN_LESSONS,
                lessonsCompleted: 0,
                unlocked: false,
                currentChildRank: null,
                leaderboard: [],
            });
        }

        const childIds = children.map((c) => c._id);

        // 2. Aggregate total globalQuizzesCompleted per child
        const progressAgg = await CategoryProgress.aggregate([
            { $match: { childId: { $in: childIds } } },
            {
                $group: {
                    _id: "$childId",
                    totalLessons: { $sum: "$globalQuizzesCompleted" },
                },
            },
        ]);

        const lessonsMap = new Map<string, number>();
        for (const row of progressAgg) {
            lessonsMap.set(row._id.toString(), row.totalLessons);
        }

        // 3. Filter: only children with >= MIN_LESSONS
        const eligible = children.filter(
            (c) => (lessonsMap.get(c._id.toString()) ?? 0) >= MIN_LESSONS
        );

        // 4. Sort: totalXP desc → gems desc → streak desc
        eligible.sort((a, b) => {
            const xpDiff = (b.totalXP ?? 0) - (a.totalXP ?? 0);
            if (xpDiff !== 0) return xpDiff;
            const gemDiff = (b.gems ?? 0) - (a.gems ?? 0);
            if (gemDiff !== 0) return gemDiff;
            return (b.streak ?? 0) - (a.streak ?? 0);
        });

        // 5. Build ranked list
        const leaderboard = eligible.map((c, i) => ({
            rank: i + 1,
            _id: c._id.toString(),
            name: c.name,
            avatar: c.avatar ?? "🦊",
            age: c.age,
            totalXP: c.totalXP ?? 0,
            gems: c.gems ?? 0,
            streak: c.streak ?? 0,
            totalLessons: lessonsMap.get(c._id.toString()) ?? 0,
            isCurrentChild: c._id.toString() === userId,
        }));

        // 6. Check if current child is eligible (unlocked)
        const myLessons = lessonsMap.get(userId) ?? 0;
        const unlocked = myLessons >= MIN_LESSONS;
        const currentChildRank = leaderboard.find((l) => l.isCurrentChild) ?? null;

        return res.json({
            scope,
            minLessons: MIN_LESSONS,
            lessonsCompleted: myLessons,
            unlocked,
            currentChildRank,
            leaderboard,
        });
    } catch (error) {
        console.error("Error in getLeaderboard:", error);
        res.status(500).json({ message: "Failed to load leaderboard." });
    }
};
