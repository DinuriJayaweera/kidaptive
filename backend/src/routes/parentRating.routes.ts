import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import {
    getPromptStatus,
    submitRating,
    notNow,
    neverAsk,
} from "../controllers/parentRating.controller.js";

const router = Router();

router.use(authenticate, requireRole("parent"));

router.get("/prompt-status", getPromptStatus);
router.post("/",            submitRating);
router.post("/not-now",     notNow);
router.post("/never-ask",   neverAsk);

export default router;
