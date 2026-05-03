import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { getAgeGroupStats } from "../controllers/adminAgeGroups.controller.js";

const router = Router();
router.use(authenticate, requireRole("admin"));
router.get("/", getAgeGroupStats);

export default router;
