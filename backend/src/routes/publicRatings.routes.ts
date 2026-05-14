import { Router } from "express";
import { getPublicRatings, getPublicStats } from "../controllers/parentRating.controller.js";

const router = Router();

router.get("/public", getPublicRatings);
router.get("/stats",  getPublicStats);

export default router;
