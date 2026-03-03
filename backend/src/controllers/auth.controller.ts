import { Request, Response, NextFunction } from "express";
import {
    parseBody,
    parentSignupSchema,
    verifyOtpSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    createChildSchema,
    childLoginSchema,
} from "../validators/auth.validators.js";
import {
    signupParent,
    verifyEmailOtp,
    resendEmailOtp,
    loginParent,
    forgotPassword,
    resetPassword,
    refreshTokens,
    logoutUser,
    createChildProfile,
    getChildren,
    loginChild,
    getCurrentUser,
    loginAdmin,
} from "../services/auth.service.js";
import type { TokenPayload } from "../utils/jwt.js";

// Helper to get the authenticated user from the request
function getUser(req: Request): TokenPayload {
    return (req as Request & { user: TokenPayload }).user;
}

// Async wrapper to forward errors to Express error handler
const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) =>
        fn(req, res).catch(next);

// ── A) Signup ────────────────────────────────────────────────────────────────
export const signup = wrap(async (req, res) => {
    const data = parseBody(parentSignupSchema, req.body);
    const result = await signupParent(data, res);
    res.status(201).json(result);
});

// ── B) Verify Email OTP ──────────────────────────────────────────────────────
export const verifyEmail = wrap(async (req, res) => {
    const data = parseBody(verifyOtpSchema, req.body);
    const result = await verifyEmailOtp(data, res);
    res.json(result);
});

// ── Resend Email OTP ─────────────────────────────────────────────────────────
export const resendOtp = wrap(async (req, res) => {
    const data = parseBody(verifyOtpSchema.pick({ email: true }), req.body);
    const result = await resendEmailOtp(data);
    res.json(result);
});

// ── C) Login ─────────────────────────────────────────────────────────────────
export const login = wrap(async (req, res) => {
    const data = parseBody(loginSchema, req.body);
    const result = await loginParent(data, res);
    res.json(result);
});

// ── D) Forgot Password ──────────────────────────────────────────────────────
export const forgotPwd = wrap(async (req, res) => {
    const data = parseBody(forgotPasswordSchema, req.body);
    const result = await forgotPassword(data);
    res.json(result);
});

// ── E) Reset Password ───────────────────────────────────────────────────────
export const resetPwd = wrap(async (req, res) => {
    const data = parseBody(resetPasswordSchema, req.body);
    const result = await resetPassword(data);
    res.json(result);
});

// ── Refresh Token ────────────────────────────────────────────────────────────
export const refresh = wrap(async (req, res) => {
    const token = (req as any).cookies?.refreshToken;
    const result = await refreshTokens(token, res);
    res.json(result);
});

// ── Logout ───────────────────────────────────────────────────────────────────
export const logout = wrap(async (req, res) => {
    const userId = getUser(req)?.userId;
    const result = await logoutUser(userId, res);
    res.json(result);
});

// ── Get Current User ─────────────────────────────────────────────────────────
export const me = wrap(async (req, res) => {
    const user = await getCurrentUser(getUser(req).userId);
    res.json(user);
});

// ── Create Child ─────────────────────────────────────────────────────────────
export const addChild = wrap(async (req, res) => {
    const data = parseBody(createChildSchema, req.body);
    const child = await createChildProfile(getUser(req).userId, data);
    res.status(201).json(child);
});

// ── Get Children ─────────────────────────────────────────────────────────────
export const listChildren = wrap(async (req, res) => {
    const children = await getChildren(getUser(req).userId);
    res.json(children);
});

// ── Child Login ──────────────────────────────────────────────────────────────
export const childLoginHandler = wrap(async (req, res) => {
    const data = parseBody(childLoginSchema, req.body);
    const result = await loginChild(data, res);
    res.json(result);
});

// ── Admin Login ──────────────────────────────────────────────────────────────
export const adminLoginHandler = wrap(async (req, res) => {
    const data = parseBody(loginSchema, req.body);
    const result = await loginAdmin(data, res);
    res.json(result);
});
