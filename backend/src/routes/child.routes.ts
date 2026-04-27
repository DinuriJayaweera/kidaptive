import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import {
    getChildProfile,
    updateChildAvatar,
    updateChildProfile,
} from "../controllers/child.controller.js";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";
import { getMistakes, startMistakeSession, submitMistakeSession } from "../controllers/mistakes.controller.js";

const router = Router();

// All routes require child authentication
router.get("/profile", authenticate, requireRole("child"), getChildProfile);
router.patch("/profile", authenticate, requireRole("child"), updateChildProfile);
router.patch("/profile/avatar", authenticate, requireRole("child"), updateChildAvatar);
router.get("/leaderboard", authenticate, requireRole("child"), getLeaderboard);
router.get("/mistakes", authenticate, requireRole("child"), getMistakes);
router.post("/mistakes/start", authenticate, requireRole("child"), startMistakeSession);
router.post("/mistakes/submit", authenticate, requireRole("child"), submitMistakeSession);

export default router;
