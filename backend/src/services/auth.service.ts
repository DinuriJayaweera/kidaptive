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
    Forbidden,
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
        authProvider: user.authProvider,
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

    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    const user = await User.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "parent",
        authProvider: "local",
        emailOtp: hashedOtp,
        emailOtpExpiry: new Date(Date.now() + OTP_EXPIRY_MS),
        verificationAttempts: 0,
        lastVerificationSentAt: new Date(),
    });

    console.log(`\n\n🎯 [DEV ONLY] OTP for ${data.email} is: ${otp}\n\n`);

    // 👇 Skip email sending during tests
    if (process.env.NODE_ENV !== "test") {
        sendVerificationEmail(data.email, otp, data.name).catch((err) =>
            console.error("Email send failed (Check SMTP config in .env):", err.message),
        );
    }

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

    if (!user.emailOtp || !user.emailOtpExpiry) {
        return { success: false, message: "No OTP pending. Request a new one." };
    }

    if (user.verificationAttempts >= 5) {
        return { success: false, message: "Too many failed attempts. Please request a new verification code." };
    }

    if (new Date() > user.emailOtpExpiry) {
        return { success: false, message: "Verification code expired. Please resend." };
    }

    const isValid = await compareOtp(data.otp, user.emailOtp);
    if (!isValid) {
        user.verificationAttempts += 1;
        await user.save();
        return {
            success: false,
            message: "Invalid verification code",
            remainingAttempts: 5 - user.verificationAttempts,
        };
    }

    user.emailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    user.verificationAttempts = 0;
    await user.save();

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({
        userId: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion,
    });
    setTokenCookies(res, refreshToken);

    return {
        success: true,
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

    if (user.lastVerificationSentAt) {
        const secondsSinceLast = (Date.now() - user.lastVerificationSentAt.getTime()) / 1000;
        if (secondsSinceLast < 60) {
            const waitSeconds = Math.ceil(60 - secondsSinceLast);
            throw TooManyRequests(
                `Please wait ${waitSeconds} seconds before requesting a new code.`,
            );
        }
    }

    const otp = generateOtp();
    user.emailOtp = await hashOtp(otp);
    user.emailOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    user.verificationAttempts = 0;
    user.lastVerificationSentAt = new Date();
    await user.save();

    console.log(`\n\n🎯 [DEV ONLY] Resent OTP for ${data.email} is: ${otp}\n\n`);

    // 👇 Skip email sending during tests
    if (process.env.NODE_ENV !== "test") {
        sendVerificationEmail(data.email, otp, user.name).catch((err) =>
            console.error("Email send failed (Check SMTP config in .env):", err.message),
        );
    }

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

    if (user.authProvider === "local" && !user.emailVerified) {
        throw Forbidden("Please verify your email before logging in.");
    }

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
    if (!user) return { message: "If the email exists, a reset code has been sent." };

    const otp = generateOtp();
    user.resetOtp = await hashOtp(otp);
    user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetOtpAttempts = 0;
    await user.save();

    console.log(`\n\n🎯 [DEV ONLY] Password Reset OTP for ${data.email} is: ${otp}\n\n`);

    // 👇 Skip email sending during tests
    if (process.env.NODE_ENV !== "test") {
        sendResetEmail(data.email, otp, user.name).catch((err) =>
            console.error("Email send failed (Check SMTP config in .env):", err.message),
        );
    }

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

    user.password = data.newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    user.tokenVersion += 1;
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

    if (payload.tokenVersion !== user.tokenVersion)
        throw Unauthorized("Token has been revoked");

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

    const parent = await User.findById(parentId);
    if (!parent) throw NotFound("Parent not found");

    const childEmail = `${data.username}@child.kidaptive.local`;

    const childData: Record<string, unknown> = {
        name: data.name,
        email: childEmail,
        password: data.password ?? `dummy-${Date.now()}`,
        age: data.age,
        username: data.username,
        avatar: data.avatar ?? "default",
        role: "child",
        parentId,
        loginMethod: data.loginMethod,
        emailVerified: true,
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

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
export async function loginAdmin(
    data: { email: string; password: string },
    res: Response,
) {
    const user = await User.findOne({ email: data.email, role: "admin" });
    if (!user) throw Unauthorized("Invalid email or password");

    const valid = await user.comparePassword(data.password);
    if (!valid) throw Unauthorized("Invalid email or password");

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({
        userId: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion,
    });
    setTokenCookies(res, refreshToken);

    return {
        message: "Admin login successful",
        user: sanitizeUser(user),
        accessToken,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// G) GOOGLE LOGIN — existing users only
// ═══════════════════════════════════════════════════════════════════════════════
export async function googleLoginParent(token: string, res: Response) {
    const { OAuth2Client } = await import("google-auth-library");
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const tokenInfo = await googleClient.getTokenInfo(token);

    const email = tokenInfo.email;
    if (!email) throw BadRequest("Could not get email from Google.");

    const user = await User.findOne({ email, role: "parent" });
    if (!user) throw NotFound("No account found with this Google email. Please sign up first.");

    user.emailVerified = true;
    user.authProvider  = "google";
    await user.save();

    const accessToken  = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({
        userId:       user._id.toString(),
        role:         user.role,
        tokenVersion: user.tokenVersion,
    });
    setTokenCookies(res, refreshToken);

    return { message: "Google login successful", user: sanitizeUser(user), accessToken };
}

// ═══════════════════════════════════════════════════════════════════════════════
// H) GOOGLE SIGNUP — new users only
// ═══════════════════════════════════════════════════════════════════════════════
export async function googleSignupParent(token: string, res: Response) {
    const { OAuth2Client } = await import("google-auth-library");
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const tokenInfo = await googleClient.getTokenInfo(token);

    const email = tokenInfo.email;
    if (!email) throw BadRequest("Could not get email from Google.");

    const existing = await User.findOne({ email });
    if (existing) throw Conflict("An account with this email already exists. Please log in instead.");

    const name = (tokenInfo as any).name ?? email.split("@")[0];

    const user = await User.create({
        name,
        email,
        password:      "google-oauth-" + Math.random().toString(36).slice(2),
        role:          "parent",
        authProvider:  "google",
        emailVerified: true,
    });

    const accessToken  = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({
        userId:       user._id.toString(),
        role:         user.role,
        tokenVersion: user.tokenVersion,
    });
    setTokenCookies(res, refreshToken);

    return { message: "Account created successfully!", user: sanitizeUser(user), accessToken };
}