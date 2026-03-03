import { Router, Request, Response, NextFunction } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import {
    signup,
    verifyEmail,
    resendOtp,
    login,
    forgotPwd,
    resetPwd,
    refresh,
    logout,
    me,
    addChild,
    listChildren,
    childLoginHandler,
} from "../controllers/auth.controller.js";

const router = Router();

// ── Simple in-memory rate limiter ────────────────────────────────────────────
function createRateLimiter(windowMs: number, max: number) {
    const hits = new Map<string, { count: number; resetAt: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = req.ip ?? "unknown";
        const now = Date.now();
        const record = hits.get(key);

        if (!record || now > record.resetAt) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }

        if (record.count >= max) {
            res.status(429).json({ message: "Too many requests. Please try again later." });
            return;
        }

        record.count += 1;
        next();
    };
}

const authLimiter = createRateLimiter(15 * 60 * 1000, 20); // 20 req / 15 min
const otpLimiter = createRateLimiter(10 * 60 * 1000, 15);  // 15 req / 10 min

// ── Public auth routes ───────────────────────────────────────────────────────
router.post("/auth/signup", authLimiter, signup);
router.post("/auth/verify-email", otpLimiter, verifyEmail);
router.post("/auth/resend-otp", otpLimiter, resendOtp);
router.post("/auth/login", authLimiter, login);
router.post("/auth/forgot-password", otpLimiter, forgotPwd);
router.post("/auth/reset-password", otpLimiter, resetPwd);
router.post("/auth/child/login", authLimiter, childLoginHandler);

// ── Token management ─────────────────────────────────────────────────────────
router.post("/auth/refresh", refresh);
router.post("/auth/logout", authenticate, logout);

// ── Authenticated routes ─────────────────────────────────────────────────────
router.get("/auth/me", authenticate, me);

// ── Parent-only routes ───────────────────────────────────────────────────────
router.post("/parents/children", authenticate, requireRole("parent"), addChild);
router.get("/parents/children", authenticate, requireRole("parent"), listChildren);

export default router;
