import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import {
  getParentChildren,
  getChildProgress,
  updateChild,
  deleteChild,
} from "../controllers/parent.controller.js";

const router = Router();

router.get("/children", authenticate, requireRole("parent"), getParentChildren);
router.get("/child/:id/progress", authenticate, requireRole("parent"), getChildProgress);
router.put("/child/:id", authenticate, requireRole("parent"), updateChild);
router.delete("/child/:id", authenticate, requireRole("parent"), deleteChild);

export default router;
