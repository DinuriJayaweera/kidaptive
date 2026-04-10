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

type AuthRequest = Request & { user: TokenPayload };

// GET /api/placement-test/status
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
      res.status(400).json({ message: error.message, allCompleted: true });
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
    res.json(result);
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
    if (!data) { res.status(404).json({ message: "No placement results found" }); return; }
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
