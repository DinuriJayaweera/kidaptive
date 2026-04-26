import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import {
  getParentChildren,
  getChildProgress,
  updateChild,
  deleteChild,
  getProfile,
  patchProfile,
  uploadAvatar,
  changePassword,
  removeAccount,
} from "../controllers/parent.controller.js";

const router = Router();

// ── Child management ─────────────────────────────────────────────────────────
router.get("/children", authenticate, requireRole("parent"), getParentChildren);
router.get("/child/:id/progress", authenticate, requireRole("parent"), getChildProgress);
router.put("/child/:id", authenticate, requireRole("parent"), updateChild);
router.delete("/child/:id", authenticate, requireRole("parent"), deleteChild);

// ── Parent profile & settings ────────────────────────────────────────────────
router.get("/profile", authenticate, requireRole("parent"), getProfile);
router.patch("/profile", authenticate, requireRole("parent"), patchProfile);
router.post("/avatar", authenticate, requireRole("parent"), uploadAvatar);
router.post("/change-password", authenticate, requireRole("parent"), changePassword);
router.delete("/account", authenticate, requireRole("parent"), removeAccount);

export default router;
