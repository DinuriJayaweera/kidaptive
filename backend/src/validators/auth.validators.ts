import { z } from "zod";
import { AppError } from "../utils/AppError.js";

// ── Parent Signup ────────────────────────────────────────────────────────────
export const parentSignupSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters").trim(),
        email: z.string().email("Invalid email address").toLowerCase().trim(),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// ── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtpSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    otp: z
        .string()
        .length(6, "OTP must be 6 digits")
        .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

// ── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1, "Password is required"),
});

// ── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
});

// ── Reset Password ───────────────────────────────────────────────────────────
export const resetPasswordSchema = z
    .object({
        email: z.string().email().toLowerCase().trim(),
        otp: z.string().length(6).regex(/^\d{6}$/),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// ── Create Child ─────────────────────────────────────────────────────────────
export const createChildSchema = z
    .object({
        name: z.string().min(1, "Name is required").trim(),
        age: z.number().int().min(3, "Minimum age is 3").max(15, "Maximum age is 15"),
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
        avatar: z.string().optional(),
        emojiPassword: z.string().min(4, "Emoji password must have at least 4 emojis"),
    });

// ── Child Login ──────────────────────────────────────────────────────────────
export const childLoginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    emojiPassword: z.string().min(4, "Emoji password must have at least 4 emojis"),
});

// ── Helper: parse and format Zod errors ──────────────────────────────────────
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
        }));
        throw new AppError("Validation failed", 400, errors);
    }
    return result.data;
}
