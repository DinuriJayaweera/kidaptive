import { Router } from "express";
import { start, submitQuiz, getDashboard, getCategoryProgressController, getStats, getQuestions, createQuestion, updateQuestion, deleteQuestion } from "../controllers/quiz.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Start a quiz (handles both normal + champion via level detection)
router.get("/start", requireRole("child"), start);

// Submit quiz (handles both normal + champion via level detection)
router.post("/submit", requireRole("child"), submitQuiz);

// Get child dashboard stats and categories
router.get("/dashboard", requireRole("child"), getDashboard);

// Get category progress for a child
router.get("/progress/:categoryId", requireRole("child"), getCategoryProgressController);

// --- Admin CRUD Operations ---
router.get('/questions/stats', requireRole('admin'), getStats);
router.get('/questions/', requireRole('admin'), getQuestions);
router.post('/questions/', requireRole('admin'), createQuestion);
router.put('/questions/:id', requireRole('admin'), updateQuestion);
router.delete('/questions/:id', requireRole('admin'), deleteQuestion);

export default router;
