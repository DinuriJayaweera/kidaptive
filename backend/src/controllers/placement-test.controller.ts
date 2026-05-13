import { Request, Response } from "express";
import type { TokenPayload } from "../utils/jwt.js";
import User from "../models/User.js";
import {
  generateTestQuestions,
  submitTestAnswers,
  getFinalResults,
  getPlacementStatus,
  resetPlacement,
} from "../services/placement-test.service.js";
import { evaluateAchievements } from "../services/achievements.service.js";
import { createAdminNotification } from "../services/adminNotification.service.js";

type AuthRequest = Request & { user: TokenPayload };

// GET /api/placement-test/status
// GET /api/placement-test/status (Legacy, uses PlacementResult)
export const status = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user;
    const child = await User.findById(userId).select("age");
    if (!child) { res.status(404).json({ message: "Child not found" }); return; }

    const ageGroup = child.age ? `${child.age}-${child.age + 1}` : "5-6";
    const result = await getPlacementStatus(userId, ageGroup);
    res.json(result);
  } catch (error) {
    console.error("Placement status error:", error);
    res.status(500).json({ message: "Failed to get placement status" });
  }
};

// GET /api/placement/status
export const userPlacementStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user;
    const child = await User.findById(userId).select("placementCompleted");
    if (!child) {
      res.status(404).json({ message: "Child not found" });
      return;
    }
    res.json({ placementCompleted: child.placementCompleted ?? false });
  } catch (error) {
    console.error("User placement status error:", error);
    res.status(500).json({ message: "Failed to get placement status" });
  }
};

// POST /api/placement-test/generate
export const generate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user;
    const child = await User.findById(userId).select("age");
    if (!child) { res.status(404).json({ message: "Child not found" }); return; }

    const ageGroup = child.age ? `${child.age}-${child.age + 1}` : "5-6";
    const test = await generateTestQuestions(userId, ageGroup);
    res.json(test);
  } catch (error: any) {
    if (error.message === "All categories already evaluated") {
      res.status(200).json({ message: error.message, allCompleted: true });
      return;
    }
    console.error("Generate test error:", error);
    res.status(500).json({ message: "Failed to generate test" });
  }
};

// POST /api/placement-test/submit
export const submit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ message: "Answers are required" });
      return;
    }

    const child = await User.findById(userId).select("age");
    if (!child) { res.status(404).json({ message: "Child not found" }); return; }

    const ageGroup = child.age ? `${child.age}-${child.age + 1}` : "5-6";
    const result = await submitTestAnswers(userId, ageGroup, answers);

    // ── Achievement evaluation ──
    // Placement-related achievements (First Crown, Starter/Explorer/Champion
    // Crown) become eligible the moment a placement test result lands.
    // Don't block the response on this.
    let newlyUnlockedAchievements: string[] = [];
    try {
      newlyUnlockedAchievements = await evaluateAchievements(userId);
    } catch (achErr) {
      console.error("Achievement evaluation failed (non-fatal):", achErr);
    }

    if (result.allCompleted) {
      const child = await User.findById(userId).select('name age');
      if (child) {
        createAdminNotification('placement_completed', '📋 Placement Test Completed',
          `${child.name} (age ${child.age}) has completed the placement test and been assigned to their learning levels.`, '📋').catch(() => {});
      }
    }

    res.json({ ...result, newlyUnlockedAchievements });
  } catch (error) {
    console.error("Submit test error:", error);
    res.status(500).json({ message: "Failed to submit test" });
  }
};

// GET /api/placement-test/results
export const results = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user;
    const data = await getFinalResults(userId);
    res.json(data);
  } catch (error) {
    console.error("Get results error:", error);
    res.status(500).json({ message: "Failed to get results" });
  }
};

// POST /api/placement-test/reset
export const reset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user;
    await resetPlacement(userId);
    res.json({ message: "Placement reset successfully" });
  } catch (error) {
    console.error("Reset placement error:", error);
    res.status(500).json({ message: "Failed to reset placement" });
  }
};
