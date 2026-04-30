import { Request, Response } from "express";
import type { TokenPayload } from "../utils/jwt.js";
import {
    getAchievementsForChild,
    evaluateAchievements,
} from "../services/achievements.service.js";

type AuthRequest = Request & { user: TokenPayload };

/**
 * GET /api/child/achievements
 * Returns full catalog with unlock state + progress for the child.
 */
export const getAchievements = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthRequest).user;
        const data = await getAchievementsForChild(userId);
        res.json(data);
    } catch (err) {
        console.error("Error in getAchievements:", err);
        res.status(500).json({ message: "Failed to load achievements." });
    }
};

/**
 * POST /api/child/achievements/evaluate
 * Manually re-runs the evaluator. Useful as a recovery path or for
 * triggering evaluation on app open. Returns the newly-unlocked keys
 * so the client can show a popup.
 */
export const triggerEvaluation = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as AuthRequest).user;
        const newlyUnlocked = await evaluateAchievements(userId);
        res.json({ newlyUnlocked });
    } catch (err) {
        console.error("Error in triggerEvaluation:", err);
        res.status(500).json({ message: "Failed to evaluate achievements." });
    }
};
