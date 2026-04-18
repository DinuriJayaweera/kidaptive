import { Request, Response } from 'express';
import User from '../models/User.js';
import PlacementResult from '../models/placementResult.model.js';
import type { TokenPayload } from '../utils/jwt.js';

type AuthRequest = Request & { user: TokenPayload };

export const submitQuiz = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = (req as AuthRequest).user;
        const { score } = req.body;

        if (typeof score !== 'number') {
            res.status(400).json({ message: 'Score is required and must be a number' });
            return;
        }

        const child = await User.findById(userId);
        if (!child) {
            res.status(404).json({ message: 'Child not found' });
            return;
        }

        let totalXP = child.totalXP || 0;
        let gems = child.gems || 0;
        let streak = child.streak || 0;
        const lastPlayedDate = child.lastPlayedDate;

        let xpGained = 0;
        let gemsGained = 0;

        if (score >= 75) {
            xpGained += 10;
            gemsGained += 1;
            totalXP += 10;
            gems += 1;
        }

        // Streak logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastPlayed = lastPlayedDate ? new Date(lastPlayedDate) : null;
        if (lastPlayed) {
            lastPlayed.setHours(0, 0, 0, 0);
        }

        if (!lastPlayed || lastPlayed.getTime() !== today.getTime()) {
            child.lastPlayedDate = new Date(); // update to right now

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastPlayed && lastPlayed.getTime() === yesterday.getTime()) {
                streak += 1;
            } else {
                // If it wasn't yesterday, break streak back to 1
                streak = 1;
            }

            // Streak bonus
            if (streak === 3) {
                totalXP += 5;
                xpGained += 5;
            } else if (streak === 5) {
                totalXP += 10;
                xpGained += 10;
            }
        }

        child.totalXP = totalXP;
        child.gems = gems;
        child.streak = streak;

        await child.save();

        res.json({
            message: 'Quiz submitted successfully',
            xpGained,
            gemsGained,
            totalXP,
            gems,
            streak,
        });

    } catch (error) {
        console.error('Quiz submit error:', error);
        res.status(500).json({ message: 'Failed to submit quiz' });
    }
};

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = (req as AuthRequest).user;

        const child = await User.findById(userId).select('totalXP gems streak lastPlayedDate name');
        if (!child) {
            res.status(404).json({ message: 'Child not found' });
            return;
        }

        // Calculate current streak (if they missed yesterday, it should be 0)
        let currentStreak = child.streak || 0;
        if (child.lastPlayedDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const lastPlayed = new Date(child.lastPlayedDate);
            lastPlayed.setHours(0, 0, 0, 0);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // If lastPlayed is BEFORE yesterday, they missed a day
            if (lastPlayed.getTime() < yesterday.getTime()) {
                currentStreak = 0;
            }
        }

        const placement = await PlacementResult.findOne({ childId: userId });

        let finalTotalXP = child.totalXP || 0;
        let finalGems = child.gems || 0;

        // Retroactive fix: if XP or Gems is 0 but they finished placement, backfill it
        if ((finalTotalXP === 0 || finalGems === 0) && placement && placement.placementCompleted) {
            const getXPForScore = (s: number) => {
                if (s < 50) return 0;
                if (s < 60) return 20;
                if (s < 70) return 40;
                if (s < 75) return 60;
                if (s < 85) return 80;
                return 100;
            };

            let totalPlacementXP = 0;
            let earnedGems = 0;
            for (const result of placement.categoryResults) {
                totalPlacementXP += getXPForScore(result.score);
                if (result.level === "starter") earnedGems += 1;
                else if (result.level === "explorer") earnedGems += 3;
                else if (result.level === "champion") earnedGems += 5;
            }
            const averageXP = placement.categoryResults.length > 0 
                ? Math.round(totalPlacementXP / placement.categoryResults.length)
                : 0;

            let updated = false;

            if (finalTotalXP === 0 && averageXP > 0) {
                child.totalXP = averageXP;
                finalTotalXP = averageXP;
                updated = true;
            }
            
            if (finalGems === 0 && earnedGems > 0) {
                child.gems = earnedGems;
                finalGems = earnedGems;
                updated = true;
            }

            if (updated) {
                await child.save();
            }
        }

        const categories = placement?.categoryResults.map(cat => {
            let icon = "📚";
            if (cat.categoryId.toLowerCase().includes("noun")) icon = "A";
            else if (cat.categoryId.toLowerCase().includes("verb")) icon = "🏃‍♂️";
            else if (cat.categoryId.toLowerCase().includes("adjective")) icon = "✨";

            return {
                id: cat.categoryId,
                name: cat.categoryId,
                // uppercase first letter
                level: cat.level.charAt(0).toUpperCase() + cat.level.slice(1),
                icon,
                score: cat.score, // optional, for sorting on frontend if needed
            };
        }) || [];

        res.json({
            user: {
                name: child.name,
            },
            stats: {
                totalXp: finalTotalXP,
                gems: finalGems,
                streak: currentStreak,
            },
            categories,
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ message: 'Failed to get dashboard' });
    }
};
