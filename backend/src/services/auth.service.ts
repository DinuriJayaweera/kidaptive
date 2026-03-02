import { Response } from "express";
import User from "../models/User.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from "../utils/jwt.js";
import {
    generateOtp,
    hashOtp,
    compareOtp,
    sendVerificationEmail,
    sendResetEmail,
} from "../utils/email.js";
import {
    BadRequest,
    Unauthorized,
    Conflict,
    NotFound,
    TooManyRequests,
} from "../utils/AppError.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

// ── Helpers — set cookies + build response ───────────────────────────────────
function setTokenCookies(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/api/auth/refresh",
    });
}

function sanitizeUser(user: InstanceType<typeof User>) {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        username: user.username,
        age: user.age,
        avatar: user.avatar,
        loginMethod: user.loginMethod,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// A) PARENT SIGNUP
// ═══════════════════════════════════════════════════════════════════════════════
export async function signupParent(
    data: { name: string; email: string; password: string },
    res: Response,
) {
    const existing = await User.findOne({ email: data.email });
    if (existing) throw Conflict("An account with this email already exists");

    // Generate & hash OTP
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    const user = await User.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "parent",
        emailOtp: hashedOtp,
        emailOtpExpiry: new Date(Date.now() + OTP_EXPIRY_MS),
        emailOtpAttempts: 0,
    });

    // Log OTP to console for local development since SMTP isn't configured
    console.log(`\n\n🎯 [DEV ONLY] OTP for ${data.email} is: ${otp}\n\n`);

    // Send verification email (fire-and-forget in dev, await in prod)
    sendVerificationEmail(data.email, otp, data.name).catch((err) =>
        console.error("Email send failed (Check SMTP config in .env):", err.message),
    );

    return {
        message: "Account created! Check your email for a verification code.",
        user: sanitizeUser(user),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// B) VERIFY EMAIL OTP
// ═══════════════════════════════════════════════════════════════════════════════
export async function verifyEmailOtp(
    data: { email: string; otp: string },
    res: Response,
) {
    const user = await User.findOne({ email: data.email });
    if (!user) throw NotFound("Account not found");

    if (user.emailVerified) throw BadRequest("Email is already verified");

    if (!user.emailOtp || !user.emailOtpExpiry)
        throw BadRequest("No OTP pending. Request a new one.");

    if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS)
        throw TooManyRequests("Too many attempts. Request a new OTP.");

    if (new Date() > user.emailOtpExpiry) throw BadRequest("OTP has expired. Request a new one.");

    const isValid = await compareOtp(data.otp, user.emailOtp);
    if (!isValid) {
        user.emailOtpAttempts += 1;
        await user.save();
        throw Unauthorized("Invalid OTP");
    }

    // Mark verified & clear OTP fields
    user.emailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    user.emailOtpAttempts = 0;
    await user.save();

    // Issue tokens
    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({
        userId: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion,
    });
    setTokenCookies(res, refreshToken);

    return {
        message: "Email verified!",
        user: sanitizeUser(user),
        accessToken,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESEND EMAIL OTP
// ═══════════════════════════════════════════════════════════════════════════════
export async function resendEmailOtp(data: { email: string }) {
    const user = await User.findOne({ email: data.email });
    if (!user) throw NotFound("Account not found");
    if (user.emailVerified) throw BadRequest("Email is already verified");

    const otp = generateOtp();
    user.emailOtp = await hashOtp(otp);
    user.emailOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    user.emailOtpAttempts = 0;
    await user.save();

    console.log(`\n\n🎯 [DEV ONLY] Resent OTP for ${data.email} is: ${otp}\n\n`);
    sendVerificationEmail(data.email, otp, user.name).catch((err) =>
        console.error("Email send failed (Check SMTP config in .env):", err.message),
    );

    return { message: "A new verification code has been sent." };
}

// ═══════════════════════════════════════════════════════════════════════════════
// C) LOGIN (PARENT)
// ═══════════════════════════════════════════════════════════════════════════════
export async function loginParent(
    data: { email: string; password: string },
    res: Response,
) {
    const user = await User.findOne({ email: data.email, role: "parent" });
    if (!user) throw Unauthorized("Invalid email or password");

    const valid = await user.comparePassword(data.password);
    if (!valid) throw Unauthorized("Invalid email or password");

    // If not verified, re-send OTP
    if (!user.emailVerified) {
        const otp = generateOtp();
        user.emailOtp = await hashOtp(otp);
        user.emailOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
        user.emailOtpAttempts = 0;
        await user.save();

        sendVerificationEmail(data.email, otp, user.name).catch((err) =>
            console.error("Email send failed:", err.message),
        );

        return {
            requiresVerification: true,
            message: "Please verify your email first. A new code has been sent.",
            email: user.email,
        };
    }

    // Issue tokens
    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({
        userId: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion,
    });
    setTokenCookies(res, refreshToken);

    return {
        message: "Login successful",
        user: sanitizeUser(user),
        accessToken,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// D) FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════
export async function forgotPassword(data: { email: string }) {
    const user = await User.findOne({ email: data.email });
    // Don't reveal if user exists
    if (!user) return { message: "If the email exists, a reset code has been sent." };

    const otp = generateOtp();
    user.resetOtp = await hashOtp(otp);
    user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetOtpAttempts = 0;
    await user.save();

    console.log(`\n\n🎯 [DEV ONLY] Password Reset OTP for ${data.email} is: ${otp}\n\n`);
    sendResetEmail(data.email, otp, user.name).catch((err) =>
        console.error("Email send failed (Check SMTP config in .env):", err.message),
    );

    return { message: "If the email exists, a reset code has been sent." };
}

// ═══════════════════════════════════════════════════════════════════════════════
// E) RESET PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════
export async function resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
}) {
    const user = await User.findOne({ email: data.email });
    if (!user) throw NotFound("Account not found");

    if (!user.resetOtp || !user.resetOtpExpiry)
        throw BadRequest("No reset request pending.");

    if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS)
        throw TooManyRequests("Too many attempts. Request a new reset code.");

    if (new Date() > user.resetOtpExpiry) throw BadRequest("Reset code has expired.");

    const isValid = await compareOtp(data.otp, user.resetOtp);
    if (!isValid) {
        user.resetOtpAttempts += 1;
        await user.save();
        throw Unauthorized("Invalid reset code");
    }

    // Update password and invalidate existing refresh tokens
    user.password = data.newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    user.tokenVersion += 1; // Invalidates all existing refresh tokens
    await user.save();

    return { message: "Password has been reset. Please log in." };
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ═══════════════════════════════════════════════════════════════════════════════
export async function refreshTokens(token: string, res: Response) {
    if (!token) throw Unauthorized("No refresh token");

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId);
    if (!user) throw Unauthorized("User not found");

    // Check tokenVersion for revocation
    if (payload.tokenVersion !== user.tokenVersion)
        throw Unauthorized("Token has been revoked");

    // Rotate: issue new tokens
    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({
        userId: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion,
    });
    setTokenCookies(res, refreshToken);

    return { accessToken, user: sanitizeUser(user) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════════════════
export async function logoutUser(userId: string | undefined, res: Response) {
    // Increment tokenVersion to invalidate all refresh tokens
    if (userId) {
        await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    }
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    return { message: "Logged out" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHILD MANAGEMENT (Parent-only)
// ═══════════════════════════════════════════════════════════════════════════════
export async function createChildProfile(
    parentId: string,
    data: {
        name: string;
        age: number;
        username: string;
        avatar?: string;
        loginMethod: "pin" | "password" | "emoji";
        pin?: string;
        password?: string;
        emojiPassword?: string;
    },
) {
    const existingUsername = await User.findOne({ username: data.username });
    if (existingUsername) throw Conflict("This username is already taken");

    // Get parent's email to construct a dummy email for child
    const parent = await User.findById(parentId);
    if (!parent) throw NotFound("Parent not found");

    const childEmail = `${data.username}@child.kidaptive.local`;

    const childData: Record<string, unknown> = {
        name: data.name,
        email: childEmail,
        password: data.password ?? `dummy-${Date.now()}`, // placeholder pw if PIN/Emoji method
        age: data.age,
        username: data.username,
        avatar: data.avatar ?? "default",
        role: "child",
        parentId,
        loginMethod: data.loginMethod,
        emailVerified: true, // child emails are auto-verified
    };

    if (data.loginMethod === "pin") {
        childData.pin = data.pin;
    } else if (data.loginMethod === "emoji") {
        childData.emojiPassword = data.emojiPassword;
    } else {
        childData.password = data.password;
    }

    const child = await User.create(childData);
    return sanitizeUser(child);
}

export async function getChildren(parentId: string) {
    return User.find({ parentId, role: "child" }).select(
        "-password -pin -emailOtp -resetOtp -emailOtpExpiry -resetOtpExpiry -emailOtpAttempts -resetOtpAttempts -tokenVersion",
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHILD LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
export async function loginChild(
    data: { username: string; pin?: string; password?: string; emojiPassword?: string },
    res: Response,
) {
    const user = await User.findOne({ username: data.username, role: "child" });
    if (!user) throw Unauthorized("We couldn't find that username.");

    if (user.loginMethod === "emoji") {
        if (!data.emojiPassword) throw BadRequest("Emoji pattern is required");
        if (!(await user.compareEmojiPassword(data.emojiPassword)))
            throw Unauthorized("That pattern doesn't look right. Try again!");
    } else if (user.loginMethod === "pin") {
        if (!data.pin) throw BadRequest("PIN is required");
        if (!(await user.comparePin(data.pin)))
            throw Unauthorized("That PIN doesn't look right. Try again!");
    } else {
        if (!data.password) throw BadRequest("Password is required");
        // Legacy accounts without explicit loginMethod default to password
        if (!(await user.comparePassword(data.password)))
            throw Unauthorized("Wrong password. Try again!");
    }

    const accessToken = signAccessToken({ userId: user._id.toString(), role: "child" });
    const refreshToken = signRefreshToken({
        userId: user._id.toString(),
        role: "child",
        tokenVersion: user.tokenVersion,
    });
    setTokenCookies(res, refreshToken);

    return {
        message: "Login successful",
        user: sanitizeUser(user),
        accessToken,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET CURRENT USER (for /me)
// ═══════════════════════════════════════════════════════════════════════════════
export async function getCurrentUser(userId: string) {
    const user = await User.findById(userId).select(
        "-password -pin -emailOtp -resetOtp -emailOtpExpiry -resetOtpExpiry -emailOtpAttempts -resetOtpAttempts -tokenVersion",
    );
    if (!user) throw NotFound("User not found");
    return user;
}
