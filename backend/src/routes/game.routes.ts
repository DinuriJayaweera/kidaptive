import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { getGames, unlockGame, getLevelData, submitScore } from "../controllers/game.controller.js";

const router = Router();

router.get("/", authenticate, requireRole("child"), getGames);
router.post("/unlock", authenticate, requireRole("child"), unlockGame);
router.get("/:gameId/levels", authenticate, requireRole("child"), getLevelData);
router.post("/:gameId/score", authenticate, requireRole("child"), submitScore);

export default router;
