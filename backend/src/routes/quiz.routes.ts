import { Router } from "express";
import { submitQuiz, getDashboard } from "../controllers/quiz.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Allow child to submit quiz
// Allow child to submit quiz
router.post("/submit", requireRole("child"), submitQuiz);

// Get child dashboard stats and categories
router.get("/dashboard", requireRole("child"), getDashboard);

export default router;
