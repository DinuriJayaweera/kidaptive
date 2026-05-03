import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import PlacementResult from "../models/placementResult.model.js";
import ActivityLog from "../models/activityLog.model.js";
import CategoryProgress from "../models/categoryProgress.model.js";

const AGE_GROUP_ORDER = ["5-6", "7-8", "9-10"];

export async function getPerformanceData(req: Request, res: Response, next: NextFunction) {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalActiveUsers,
            totalChildren,
            placementCompletedCount,
            weeklyQuizzesTaken,
            placementScoreAgg,
            performanceByAgeGroupRaw,
            mostAttemptedRaw,
            weakCategoryRaw,
        ] = await Promise.all([
            // Total active users (treat missing isActive as active)
            User.countDocuments({ $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
            User.countDocuments({ role: "child" }),
            User.countDocuments({ role: "child", placementCompleted: true }),
            ActivityLog.countDocuments({ type: "quiz_complete", createdAt: { $gte: sevenDaysAgo } }),

            // Global avg placement score
            PlacementResult.aggregate([
                { $unwind: "$categoryResults" },
                { $group: { _id: null, avgScore: { $avg: "$categoryResults.score" } } },
            ]),

            // Avg score by age group
            PlacementResult.aggregate([
                { $unwind: "$categoryResults" },
                { $group: { _id: "$ageGroup", avgScore: { $avg: "$categoryResults.score" }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),

            // Most attempted categories by quizzesCompleted
            CategoryProgress.aggregate([
                { $group: { _id: "$categoryId", totalAttempts: { $sum: "$quizzesCompleted" } } },
                { $sort: { totalAttempts: -1 } },
                { $limit: 5 },
            ]),

            // Weak categories (avg placement score < 65)
            PlacementResult.aggregate([
                { $unwind: "$categoryResults" },
                { $group: { _id: "$categoryResults.categoryId", avgScore: { $avg: "$categoryResults.score" }, count: { $sum: 1 } } },
                { $match: { avgScore: { $lt: 65 } } },
                { $sort: { avgScore: 1 } },
                { $limit: 4 },
            ]),
        ]);

        const avgPlacementScore = placementScoreAgg[0]?.avgScore ? Math.round(placementScoreAgg[0].avgScore) : 0;
        const completionRate = totalChildren > 0 ? Math.round((placementCompletedCount / totalChildren) * 100) : 0;

        const performanceByAgeGroup = AGE_GROUP_ORDER.map((ag) => {
            const found = performanceByAgeGroupRaw.find((r: any) => r._id === ag);
            return { ageGroup: ag, avgScore: found ? Math.round(found.avgScore) : 0, count: found?.count ?? 0 };
        });

        // Compute pass rate per most-attempted category from ActivityLog
        const mostAttemptedCategories = await Promise.all(
            mostAttemptedRaw.map(async (item: any) => {
                const [total, passed] = await Promise.all([
                    ActivityLog.countDocuments({ type: "quiz_complete", categoryId: item._id }),
                    ActivityLog.countDocuments({ type: "quiz_complete", categoryId: item._id, score: { $gte: 60 } }),
                ]);
                const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
                return { categoryName: item._id, totalAttempts: item.totalAttempts, passRate };
            })
        );

        const weakCategories = weakCategoryRaw.map((w: any) => ({
            categoryName: w._id,
            avgScore: Math.round(w.avgScore),
        }));

        res.json({
            stats: { totalActiveUsers, avgPlacementScore, completionRate, weeklyQuizzesTaken },
            performanceByAgeGroup,
            mostAttemptedCategories,
            weakCategories,
        });
    } catch (err) {
        next(err);
    }
}
