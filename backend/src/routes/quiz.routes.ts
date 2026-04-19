import { Router } from "express";
import { start, submitQuiz, getDashboard, getStats, getQuestions, createQuestion, updateQuestion, deleteQuestion } from "../controllers/quiz.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Start a quiz
router.get("/start", requireRole("child"), start);

// Allow child to submit quiz
router.post("/submit", requireRole("child"), submitQuiz);

// Get child dashboard stats and categories
router.get("/dashboard", requireRole("child"), getDashboard);

// --- Admin CRUD Operations ---
router.get('/questions/stats', requireRole('admin'), getStats);
router.get('/questions/', requireRole('admin'), getQuestions);
router.post('/questions/', requireRole('admin'), createQuestion);
router.put('/questions/:id', requireRole('admin'), updateQuestion);
router.delete('/questions/:id', requireRole('admin'), deleteQuestion);

export default router;
