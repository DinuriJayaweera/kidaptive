import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { getAdminRatings } from "../controllers/parentRating.controller.js";

const router = Router();

router.get("/", authenticate, requireRole("admin"), getAdminRatings);

export default router;
