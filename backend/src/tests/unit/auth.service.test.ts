import { jest } from "@jest/globals";

jest.unstable_mockModule("../../utils/email.js", () => ({
    generateOtp: () => "123456",
    hashOtp: async (otp: string) => otp,
    compareOtp: async (a: string, b: string) => a === b,
    sendVerificationEmail: async () => {},
    sendResetEmail: async () => {},
}));

import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createVerifiedParent, createUnverifiedParent, createAdmin, createChild } from "../helpers/testUser.js";
import { signupParent, loginParent, loginAdmin, loginChild, verifyEmailOtp, resendEmailOtp, forgotPassword, resetPassword, refreshTokens, logoutUser } from "../../services/auth.service.js";
import User from "../../models/User.js";

const mockRes = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
}) as any;

// ═════════════════════════════════════════════════════════════════════════════
beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
// ═════════════════════════════════════════════════════════════════════════════


// ── A) PARENT SIGNUP ──────────────────────────────────────────────────────────
describe("signupParent", () => {

    it("creates a new parent account and returns a message", async () => {
        const res = mockRes();
        const result = await signupParent(
            { name: "Jane", email: "jane@test.com", password: "Password123!" },
            res,
        );
        expect(result.message).toContain("verification code");
        expect(result.user.email).toBe("jane@test.com");
        expect(result.user.role).toBe("parent");
    });

    it("new parent starts as unverified", async () => {
        const res = mockRes();
        await signupParent(
            { name: "Jane", email: "jane@test.com", password: "Password123!" },
            res,
        );
        const dbUser = await User.findOne({ email: "jane@test.com" });
        expect(dbUser?.emailVerified).toBe(false);
    });

    it("throws conflict if email already exists", async () => {
        await createVerifiedParent({ email: "jane@test.com" });
        const res = mockRes();
        await expect(
            signupParent({ name: "Jane", email: "jane@test.com", password: "Password123!" }, res),
        ).rejects.toMatchObject({ statusCode: 409 });
    });

});


// ── B) VERIFY EMAIL OTP ───────────────────────────────────────────────────────
describe("verifyEmailOtp", () => {

    it("verifies email with correct OTP and returns accessToken", async () => {
        const res = mockRes();
        await signupParent({ name: "Jane", email: "jane@test.com", password: "Password123!" }, res);

        // Bypass bcrypt — set a known plain OTP directly in DB
        await User.findOneAndUpdate(
            { email: "jane@test.com" },
            { emailOtp: "123456" },  // store plain — compareOtp will bcrypt.compare against this
        );

        // compareOtp does bcrypt.compare("123456", "123456") — won't match
        // So instead we need to store it hashed:
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash("123456", 10);
        await User.findOneAndUpdate({ email: "jane@test.com" }, { emailOtp: hashed });

        const result = await verifyEmailOtp({ email: "jane@test.com", otp: "123456" }, res);
        expect(result.success).toBe(true);
        expect(result.accessToken).toBeDefined();
        expect(result.user?.emailVerified).toBe(true);
    });

    it("marks user as verified in database after correct OTP", async () => {
        const res = mockRes();
        await signupParent({ name: "Jane", email: "jane@test.com", password: "Password123!" }, res);
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash("123456", 10);
        await User.findOneAndUpdate({ email: "jane@test.com" }, { emailOtp: hashed });

        await verifyEmailOtp({ email: "jane@test.com", otp: "123456" }, res);

        const updatedUser = await User.findOne({ email: "jane@test.com" });
        expect(updatedUser?.emailVerified).toBe(true);
        expect(updatedUser?.emailOtp).toBeUndefined();
    });

    it("returns failure for wrong OTP", async () => {
        const res = mockRes();
        await signupParent({ name: "Jane", email: "jane@test.com", password: "Password123!" }, res);
        const result = await verifyEmailOtp({ email: "jane@test.com", otp: "000000" }, res);
        expect(result.success).toBe(false);
        expect(result.message).toContain("Invalid");
    });

    it("increments verificationAttempts on wrong OTP", async () => {
        const res = mockRes();
        await signupParent({ name: "Jane", email: "jane@test.com", password: "Password123!" }, res);
        await verifyEmailOtp({ email: "jane@test.com", otp: "000000" }, res);
        const dbUser = await User.findOne({ email: "jane@test.com" });
        expect(dbUser?.verificationAttempts).toBe(1);
    });

    it("throws 404 if account not found", async () => {
        const res = mockRes();
        await expect(
            verifyEmailOtp({ email: "nobody@test.com", otp: "123456" }, res),
        ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("throws 400 if email already verified", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const res = mockRes();
        await expect(
            verifyEmailOtp({ email: "parent@test.com", otp: "123456" }, res),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

});

// ── C) RESEND OTP COOLDOWN ────────────────────────────────────────────────────
describe("resendEmailOtp", () => {

    it("throws TooManyRequests if resend within 60 seconds", async () => {
        const res = mockRes();
        // Signup sets lastVerificationSentAt to now
        await signupParent({ name: "Jane", email: "jane@test.com", password: "Password123!" }, res);

        // Immediately try to resend — should be blocked by 60s cooldown
        await expect(
            resendEmailOtp({ email: "jane@test.com" }),
        ).rejects.toMatchObject({ statusCode: 429 });
    });

    it("allows resend after 60 seconds have passed", async () => {
        const res = mockRes();
        await signupParent({ name: "Jane", email: "jane@test.com", password: "Password123!" }, res);

        // Manually backdate lastVerificationSentAt by 61 seconds
        await User.findOneAndUpdate(
            { email: "jane@test.com" },
            { lastVerificationSentAt: new Date(Date.now() - 61 * 1000) },
        );

        // Now resend should work
        const result = await resendEmailOtp({ email: "jane@test.com" });
        expect(result.message).toContain("new verification code");
    });

    it("throws 404 if email not found", async () => {
        await expect(
            resendEmailOtp({ email: "nobody@test.com" }),
        ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("throws 400 if email already verified", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        await expect(
            resendEmailOtp({ email: "parent@test.com" }),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

});


// ── D) PARENT LOGIN ───────────────────────────────────────────────────────────
describe("loginParent", () => {

    it("logs in a verified parent and returns accessToken", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const res = mockRes();
        const result = await loginParent(
            { email: "parent@test.com", password: "Password123!" },
            res,
        );
        expect(result.accessToken).toBeDefined();
        expect(result.user.role).toBe("parent");
        expect(res.cookie).toHaveBeenCalled();
    });

    it("blocks login if email not verified", async () => {
        await createUnverifiedParent({ email: "unverified@test.com" });
        const res = mockRes();
        await expect(
            loginParent({ email: "unverified@test.com", password: "Password123!" }, res),
        ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("rejects wrong password", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const res = mockRes();
        await expect(
            loginParent({ email: "parent@test.com", password: "WrongPassword!" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("rejects non-existent email", async () => {
        const res = mockRes();
        await expect(
            loginParent({ email: "nobody@test.com", password: "Password123!" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

});


// ── E) FORGOT PASSWORD ────────────────────────────────────────────────────────
describe("forgotPassword", () => {

    it("sets resetOtp on user when email exists", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        await forgotPassword({ email: "parent@test.com" });

        const dbUser = await User.findOne({ email: "parent@test.com" });
        expect(dbUser?.resetOtp).toBeDefined();
        expect(dbUser?.resetOtpExpiry).toBeDefined();
    });

    it("returns same message even if email does not exist (security)", async () => {
        // Should NOT reveal whether email exists
        const result = await forgotPassword({ email: "nobody@test.com" });
        expect(result.message).toContain("If the email exists");
    });

});


// ── F) RESET PASSWORD ─────────────────────────────────────────────────────────
describe("resetPassword", () => {

    // Helper to set a known hashed OTP on a user
    async function setResetOtp(email: string, otp: string) {
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash(otp, 10);
        await User.findOneAndUpdate(
            { email },
            { resetOtp: hashed, resetOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), resetOtpAttempts: 0 },
        );
    }

    it("resets password successfully with correct OTP", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        await setResetOtp("parent@test.com", "123456");

        const result = await resetPassword({
            email: "parent@test.com",
            otp: "123456",
            newPassword: "NewPassword123!",
        });
        expect(result.message).toContain("reset");
    });

    it("can login with new password after reset", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        await setResetOtp("parent@test.com", "123456");

        await resetPassword({
            email: "parent@test.com",
            otp: "123456",
            newPassword: "NewPassword123!",
        });

        const res = mockRes();
        await expect(
            loginParent({ email: "parent@test.com", password: "Password123!" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });

        const result = await loginParent(
            { email: "parent@test.com", password: "NewPassword123!" }, res,
        );
        expect(result.accessToken).toBeDefined();
    });

    it("rejects wrong OTP during reset", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        await setResetOtp("parent@test.com", "123456");

        await expect(
            resetPassword({ email: "parent@test.com", otp: "000000", newPassword: "NewPassword123!" }),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("throws 400 if no reset was requested", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        await expect(
            resetPassword({ email: "parent@test.com", otp: "123456", newPassword: "NewPassword123!" }),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

});

// ── G) REFRESH TOKEN ──────────────────────────────────────────────────────────
describe("refreshTokens", () => {

    it("issues new accessToken with valid refresh token cookie", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const res = mockRes();

        // Login to get tokens
        await loginParent({ email: "parent@test.com", password: "Password123!" }, res);

        // Get the refresh token that was set in cookie
        const cookieCall = res.cookie.mock.calls[0];
        const refreshToken = cookieCall[1] as string;

        // Use refresh token to get new access token
        const res2 = mockRes();
        const result = await refreshTokens(refreshToken, res2);

        expect(result.accessToken).toBeDefined();
        expect(result.user.email).toBe("parent@test.com");
    });

   it("throws 401 if refresh token is fake", async () => {
    const res = mockRes();
    await expect(
        refreshTokens("fake.token.here", res),
    ).rejects.toMatchObject({ statusCode: 401 });
});

    it("throws 401 if refresh token is fake", async () => {
        const res = mockRes();
        await expect(
            refreshTokens("fake.token.here", res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

});


// ── H) LOGOUT ─────────────────────────────────────────────────────────────────
describe("logoutUser", () => {

    it("increments tokenVersion on logout to invalidate refresh tokens", async () => {
        const parent = await createVerifiedParent({ email: "parent@test.com" });
        const originalVersion = parent.tokenVersion;

        const res = mockRes();
        await logoutUser(parent._id.toString(), res);

        const dbUser = await User.findById(parent._id);
        expect(dbUser?.tokenVersion).toBe(originalVersion + 1);
    });

    it("clears the refresh token cookie on logout", async () => {
        const parent = await createVerifiedParent({ email: "parent@test.com" });
        const res = mockRes();

        await logoutUser(parent._id.toString(), res);

        expect(res.clearCookie).toHaveBeenCalledWith(
            "refreshToken",
            expect.objectContaining({ path: "/api/auth/refresh" }),
        );
    });

    it("handles logout gracefully even with no userId", async () => {
        const res = mockRes();
        const result = await logoutUser(undefined, res);
        expect(result.message).toBe("Logged out");
    });

});


// ── I) ADMIN LOGIN ────────────────────────────────────────────────────────────
describe("loginAdmin", () => {

    it("logs in an admin and returns accessToken", async () => {
        await createAdmin({ email: "admin@test.com" });
        const res = mockRes();
        const result = await loginAdmin(
            { email: "admin@test.com", password: "Admin123!" },
            res,
        );
        expect(result.accessToken).toBeDefined();
        expect(result.user.role).toBe("admin");
    });

    it("rejects wrong password for admin", async () => {
        await createAdmin({ email: "admin@test.com" });
        const res = mockRes();
        await expect(
            loginAdmin({ email: "admin@test.com", password: "wrongpass" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("prevents a parent account from logging in as admin", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const res = mockRes();
        await expect(
            loginAdmin({ email: "parent@test.com", password: "Password123!" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

});


// ── J) CHILD LOGIN ────────────────────────────────────────────────────────────
describe("loginChild", () => {

    it("logs in a child with correct PIN", async () => {
        const parent = await createVerifiedParent();
        await createChild(parent._id.toString(), { username: "kiddo" });
        const res = mockRes();
        const result = await loginChild({ username: "kiddo", pin: "1234" }, res);
        expect(result.accessToken).toBeDefined();
        expect(result.user.role).toBe("child");
    });

    it("rejects wrong PIN", async () => {
        const parent = await createVerifiedParent();
        await createChild(parent._id.toString(), { username: "kiddo" });
        const res = mockRes();
        await expect(
            loginChild({ username: "kiddo", pin: "9999" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("rejects unknown username", async () => {
        const res = mockRes();
        await expect(
            loginChild({ username: "ghost", pin: "1234" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("logs in a child with emoji password", async () => {
        const parent = await createVerifiedParent();
        await createChild(parent._id.toString(), {
            username: "emojikid",
            loginMethod: "emoji",
            emojiPassword: "🐶🐱🐭",
            pin: undefined,
        });
        const res = mockRes();
        const result = await loginChild({ username: "emojikid", emojiPassword: "🐶🐱🐭" }, res);
        expect(result.accessToken).toBeDefined();
    });

    it("rejects wrong emoji password", async () => {
        const parent = await createVerifiedParent();
        await createChild(parent._id.toString(), {
            username: "emojikid",
            loginMethod: "emoji",
            emojiPassword: "🐶🐱🐭",
            pin: undefined,
        });
        const res = mockRes();
        await expect(
            loginChild({ username: "emojikid", emojiPassword: "🐸🐸🐸" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("logs in a child with text password", async () => {
        const parent = await createVerifiedParent();
        await createChild(parent._id.toString(), {
            username: "passwordkid",
            loginMethod: "password",
            password: "KidPass123!",
            pin: undefined,
        });
        const res = mockRes();
        const result = await loginChild({ username: "passwordkid", password: "KidPass123!" }, res);
        expect(result.accessToken).toBeDefined();
    });

    it("rejects wrong text password for child", async () => {
        const parent = await createVerifiedParent();
        await createChild(parent._id.toString(), {
            username: "passwordkid",
            loginMethod: "password",
            password: "KidPass123!",
            pin: undefined,
        });
        const res = mockRes();
        await expect(
            loginChild({ username: "passwordkid", password: "WrongPass!" }, res),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

});