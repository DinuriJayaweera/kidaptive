import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { getPerformanceData } from "../controllers/adminPerformance.controller.js";

const router = Router();
router.use(authenticate, requireRole("admin"));
router.get("/", getPerformanceData);

export default router;
