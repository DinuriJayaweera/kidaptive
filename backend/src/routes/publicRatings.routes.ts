import { Router } from "express";
import { getPublicRatings } from "../controllers/parentRating.controller.js";

const router = Router();

router.get("/public", getPublicRatings);

export default router;
