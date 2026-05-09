import { Request, Response, NextFunction } from "express";
import os from "os";
import User from "../models/User.js";
import ActivityLog from "../models/activityLog.model.js";

function buildDateRange(days: number): string[] {
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 10);
    });
}

export async function getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
        const apiStart = Date.now();

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const dbStart = Date.now();

        const [
            totalUsers,
            newUsersThisWeek,
            activeChildrenIds,
            quizzesToday,
            xpAgg,
            userGrowthRaw,
            activityRaw,
            scoreRaw,
            recentRaw,
        ] = await Promise.all([
            User.countDocuments({ role: { $in: ["parent", "child"] } }),
            User.countDocuments({
                createdAt: { $gte: sevenDaysAgo },
                role: { $in: ["parent", "child"] },
            }),
            ActivityLog.distinct("childId", { createdAt: { $gte: todayStart } }),
            ActivityLog.countDocuments({ createdAt: { $gte: todayStart }, type: "quiz_complete" }),
            User.aggregate([
                { $match: { role: "child" } },
                { $group: { _id: null, total: { $sum: "$totalXP" } } },
            ]),
            // New registrations per day, split by role
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo },
                        role: { $in: ["parent", "child"] },
                    },
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            role: "$role",
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.date": 1 } },
            ]),
            // Activity per day (quizzes completed + xp earned)
            ActivityLog.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        quizzes: {
                            $sum: { $cond: [{ $eq: ["$type", "quiz_complete"] }, 1, 0] },
                        },
                        xp: { $sum: { $ifNull: ["$xp", 0] } },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Average quiz score per day
            ActivityLog.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo },
                        type: "quiz_complete",
                        score: { $exists: true, $ne: null },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        avgScore: { $avg: "$score" },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // 10 most recent activity log entries
            ActivityLog.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("childId", "name username")
                .lean(),
        ]);

        const dbQueryTimeMs = Date.now() - dbStart;
        const dateRange = buildDateRange(30);

        // Build user growth array — fill every day in range with 0 defaults
        const growthMap = new Map<string, { parents: number; children: number }>();
        for (const entry of userGrowthRaw) {
            const date: string = entry._id.date;
            if (!growthMap.has(date)) growthMap.set(date, { parents: 0, children: 0 });
            const item = growthMap.get(date)!;
            if (entry._id.role === "parent") item.parents = entry.count as number;
            else if (entry._id.role === "child") item.children = entry.count as number;
        }
        const userGrowth = dateRange.map((date) => ({
            date,
            ...(growthMap.get(date) ?? { parents: 0, children: 0 }),
        }));

        // Build activity trend
        const activityMap = new Map(activityRaw.map((r) => [r._id as string, r]));
        const activityTrend = dateRange.map((date) => {
            const e = activityMap.get(date);
            return { date, quizzes: (e?.quizzes as number) ?? 0, xp: (e?.xp as number) ?? 0 };
        });

        // Build score trend — null means no quiz data that day
        const scoreMap = new Map(scoreRaw.map((r) => [r._id as string, r]));
        const scoreTrend = dateRange.map((date) => {
            const e = scoreMap.get(date);
            return {
                date,
                avgScore: e ? Math.round((e.avgScore as number) * 10) / 10 : null,
            };
        });

        const mem = process.memoryUsage();
        const apiResponseTimeMs = Date.now() - apiStart;

        const recentActivity = recentRaw.map((log) => {
            const child = log.childId as unknown as { name?: string; username?: string } | null;
            return {
                type: log.type,
                childName: child?.username ?? child?.name ?? "Unknown",
                description: log.description,
                xp: log.xp,
                score: log.score,
                createdAt: log.createdAt,
            };
        });

        res.json({
            stats: {
                totalUsers,
                newUsersThisWeek,
                activeChildrenToday: activeChildrenIds.length,
                quizzesToday,
                totalXP: (xpAgg[0]?.total as number) ?? 0,
            },
            trends: { userGrowth, activityTrend, scoreTrend },
            platformHealth: {
                apiResponseTimeMs,
                dbQueryTimeMs,
                memoryUsageMB: Math.round(mem.heapUsed / 1024 / 1024),
                memoryTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
                systemMemoryGB: +(os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
                systemFreeMemoryGB: +(os.freemem() / 1024 / 1024 / 1024).toFixed(1),
                nodeVersion: process.version,
                uptime: Math.floor(process.uptime()),
            },
            recentActivity,
        });
    } catch (err) {
        next(err);
    }
}
