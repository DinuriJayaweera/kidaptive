import QuizQuestion from '../models/quizQuestion.model.js';
import { Request, Response } from 'express';
import User from '../models/User.js';
import PlacementResult from '../models/placementResult.model.js';
import type { TokenPayload } from '../utils/jwt.js';
import { startQuiz, submitQuiz as serviceSubmitQuiz } from '../services/quiz.service.js';

type AuthRequest = Request & { user: TokenPayload };

export const start = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user;
    const { categoryId } = req.query;

    if (!categoryId || typeof categoryId !== "string") {
      res.status(400).json({ message: "categoryId is required" });
      return;
    }

    const data = await startQuiz(userId, categoryId);
    res.json(data);
  } catch (error) {
    console.error("Start quiz error:", error);
    res.status(500).json({ message: "Failed to start quiz" });
  }
};
export const submitQuiz = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = (req as AuthRequest).user;
        const { categoryId, answers } = req.body;

        if (!categoryId || !answers || !Array.isArray(answers)) {
            res.status(400).json({ message: 'categoryId and answers array are required' });
            return;
        }

        const child = await User.findById(userId);
        if (!child) {
            res.status(404).json({ message: 'Child not found' });
            return;
        }

        // Call the new service which updates XP, Level, CategoryProgress, and User totalXP.
        const result = await serviceSubmitQuiz(userId, categoryId, answers);

        let streak = child.streak || 0;
        const lastPlayedDate = child.lastPlayedDate;

        // Streak logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastPlayed = lastPlayedDate ? new Date(lastPlayedDate) : null;
        if (lastPlayed) {
            lastPlayed.setHours(0, 0, 0, 0);
        }

        let streakXPToAdd = 0;

        if (!lastPlayed || lastPlayed.getTime() !== today.getTime()) {
            child.lastPlayedDate = new Date(); // update to right now

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastPlayed && lastPlayed.getTime() === yesterday.getTime()) {
                streak += 1;
            } else {
                streak = 1;
            }

            // Streak bonus
            if (streak === 3) {
                streakXPToAdd = 5;
            } else if (streak === 5) {
                streakXPToAdd = 10;
            }
        }

        child.streak = streak;
        if (streakXPToAdd > 0) {
            child.totalXP = (child.totalXP || 0) + streakXPToAdd;
        }
        await child.save();

        res.json({
            message: 'Quiz submitted successfully',
            score: result.score,
            passed: result.passed,
            levelUp: result.levelUp,
            newLevel: result.newLevel,
            categoryXP: result.newXP,
            xpGained: result.passed ? 10 + streakXPToAdd : streakXPToAdd,
            totalXP: child.totalXP,
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

// --- CRUD Operations from Practice ---

export const getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        await QuizQuestion.updateMany(
            { difficulty: { $exists: false } },
            { $set: { difficulty: 'medium' } }
        );

        const [total, diffCounts] = await Promise.all([
            QuizQuestion.countDocuments(),
            QuizQuestion.aggregate([
                { $group: { _id: { $ifNull: ['$difficulty', 'medium'] }, count: { $sum: 1 } } }
            ])
        ]);
        const stats = { total, easy: 0, medium: 0, hard: 0 };
        for (const entry of diffCounts) {
            if (entry._id === 'easy')   stats.easy   = entry.count;
            if (entry._id === 'medium') stats.medium = entry.count;
            if (entry._id === 'hard')   stats.hard   = entry.count;
        }
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ageGroup, category, difficulty, page = '1', limit = '8', search } = req.query;
        const query: any = {};
        
        if (ageGroup && ageGroup !== 'All') query.ageGroup = ageGroup;
        if (category && category !== 'All') query.category = category;
        if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
        if (search) {
            query.questionText = { $regex: search, $options: 'i' };
        }

        const p = parseInt(page as string, 10) || 1;
        const l = parseInt(limit as string, 10) || 8;
        const skip = (p - 1) * l;

        const [questions, total] = await Promise.all([
            QuizQuestion.find(query).skip(skip).limit(l).sort({ createdAt: -1 }),
            QuizQuestion.countDocuments(query)
        ]);

        res.json({ questions, total, page: p, pages: Math.ceil(total / l) });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Failed to fetch questions' });
    }
};

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const question = new QuizQuestion(req.body);
        await question.save();
        res.status(201).json(question);
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(400).json({ message: 'Failed to create question' });
    }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const question = await QuizQuestion.findByIdAndUpdate(id, req.body, { new: true });
        if (!question) {
            res.status(404).json({ message: 'Question not found' });
            return;
        }
        res.json(question);
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(400).json({ message: 'Failed to update question' });
    }
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const question = await QuizQuestion.findByIdAndDelete(id);
        if (!question) {
            res.status(404).json({ message: 'Question not found' });
            return;
        }
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ message: 'Failed to delete question' });
    }
};
