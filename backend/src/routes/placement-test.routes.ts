import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { status, generate, submit, results, reset } from "../controllers/placement-test.controller.js";

const router = Router();

// All routes require authenticated child
router.use(authenticate);
router.use(requireRole("child"));

router.get("/status", status);
router.post("/generate", generate);
router.post("/submit", submit);
router.get("/results", results);
router.post("/reset", reset);

export default router;
