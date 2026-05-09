import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { getAdminDashboard } from "../controllers/adminDashboard.controller.js";

const router = Router();
router.use(authenticate, requireRole("admin"));
router.get("/", getAdminDashboard);

export default router;
