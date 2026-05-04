import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { getProfile, updateProfile, changePassword } from "../controllers/adminProfile.controller.js";

const router = Router();
router.use(authenticate, requireRole("admin"));

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/password", changePassword);

export default router;
