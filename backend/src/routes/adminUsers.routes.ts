import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import {
    getUsers,
    getUserById,
    toggleUserStatus,
    deleteUser,
    getUserStats,
} from "../controllers/adminUsers.controller.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/stats", getUserStats);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id/status", toggleUserStatus);
router.delete("/:id", deleteUser);

export default router;
