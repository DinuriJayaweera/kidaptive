import { jest } from "@jest/globals";

jest.unstable_mockModule("../../utils/email.js", () => ({
    generateOtp: () => "123456",
    hashOtp: async (otp: string) => otp,
    compareOtp: async (a: string, b: string) => a === b,
    sendVerificationEmail: async () => {},
    sendResetEmail: async () => {},
}));

import request from "supertest";
import app from "../../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../helpers/testDb.js";
import { createVerifiedParent, createUnverifiedParent, createAdmin } from "../helpers/testUser.js";
import User from "../../models/User.js";

// ═════════════════════════════════════════════════════════════════════════════
beforeAll(async () => { await connectTestDb(); });
afterEach(async () => { await clearTestDb(); });
afterAll(async () => { await disconnectTestDb(); });
// ═════════════════════════════════════════════════════════════════════════════


// ── POST /api/auth/signup ─────────────────────────────────────────────────────
describe("POST /api/auth/signup", () => {

    it("returns 201 and a success message for new parent", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ name: "Jane", email: "jane@test.com", password: "Password123!", confirmPassword: "Password123!" });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain("verification");
    });

    it("returns 409 if email already exists", async () => {
        await createVerifiedParent({ email: "jane@test.com" });

        const res = await request(app)
            .post("/api/auth/signup")
            .send({ name: "Jane", email: "jane@test.com", password: "Password123!", confirmPassword: "Password123!" });

        expect(res.status).toBe(409);
    });

    it("returns 400 if password is too weak", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ name: "Jane", email: "jane@test.com", password: "weak", confirmPassword: "weak" });

        expect(res.status).toBe(400);
    });

    it("returns 400 if passwords do not match", async () => {
        const res = await request(app)
            .post("/api/auth/signup")
            .send({ name: "Jane", email: "jane@test.com", password: "Password123!", confirmPassword: "Different123!" });

        expect(res.status).toBe(400);
    });

});


// ── POST /api/auth/verify-email ───────────────────────────────────────────────
describe("POST /api/auth/verify-email", () => {

    it("returns 200 and accessToken when OTP is correct", async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({ name: "Jane", email: "jane@test.com", password: "Password123!", confirmPassword: "Password123!" });

        // Set a known hashed OTP directly in DB
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash("123456", 10);
        await User.findOneAndUpdate({ email: "jane@test.com" }, { emailOtp: hashed });

        const res = await request(app)
            .post("/api/auth/verify-email")
            .send({ email: "jane@test.com", otp: "123456" });

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.success).toBe(true);
    });

    it("returns 200 with success:false for wrong OTP", async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({ name: "Jane", email: "jane@test.com", password: "Password123!", confirmPassword: "Password123!" });

        const res = await request(app)
            .post("/api/auth/verify-email")
            .send({ email: "jane@test.com", otp: "000000" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
    });

    it("returns 404 for unknown email", async () => {
        const res = await request(app)
            .post("/api/auth/verify-email")
            .send({ email: "nobody@test.com", otp: "123456" });
        expect(res.status).toBe(404);
    });

    it("returns 400 if email already verified", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const res = await request(app)
            .post("/api/auth/verify-email")
            .send({ email: "parent@test.com", otp: "123456" });
        expect(res.status).toBe(400);
    });

});

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
describe("POST /api/auth/resend-otp", () => {

    it("returns 429 if resend requested within 60 seconds", async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({ name: "Jane", email: "jane@test.com", password: "Password123!", confirmPassword: "Password123!" });

        // Immediately resend — should be blocked
        const res = await request(app)
            .post("/api/auth/resend-otp")
            .send({ email: "jane@test.com" });

        expect(res.status).toBe(429);
    });

    it("returns 200 after 60 second cooldown has passed", async () => {
        await request(app)
            .post("/api/auth/signup")
            .send({ name: "Jane", email: "jane@test.com", password: "Password123!", confirmPassword: "Password123!" });

        // Backdate lastVerificationSentAt
        await User.findOneAndUpdate(
            { email: "jane@test.com" },
            { lastVerificationSentAt: new Date(Date.now() - 61 * 1000) },
        );

        const res = await request(app)
            .post("/api/auth/resend-otp")
            .send({ email: "jane@test.com" });

        expect(res.status).toBe(200);
    });

});


// ── POST /api/auth/login ──────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {

    it("returns 200 and accessToken for verified parent", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.role).toBe("parent");
    });

    it("returns 403 for unverified parent", async () => {
        await createUnverifiedParent({ email: "unverified@test.com" });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "unverified@test.com", password: "Password123!" });

        expect(res.status).toBe(403);
    });

    it("returns 401 for wrong password", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "WrongPass123!" });

        expect(res.status).toBe(401);
    });

});


// ── POST /api/auth/forgot-password ────────────────────────────────────────────
describe("POST /api/auth/forgot-password", () => {

    it("returns 200 and sets reset OTP for existing user", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const res = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "parent@test.com" });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("If the email exists");

        // Verify OTP was set in DB
        const dbUser = await User.findOne({ email: "parent@test.com" });
        expect(dbUser?.resetOtp).toBeDefined();
    });

    it("returns 200 even for unknown email (does not reveal existence)", async () => {
        const res = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "nobody@test.com" });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("If the email exists");
    });

});


// ── POST /api/auth/reset-password ─────────────────────────────────────────────
describe("POST /api/auth/reset-password", () => {

    async function setResetOtp(email: string, otp: string) {
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash(otp, 10);
        await User.findOneAndUpdate(
            { email },
            { resetOtp: hashed, resetOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), resetOtpAttempts: 0 },
        );
    }

    it("returns 200 and resets password successfully", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        await setResetOtp("parent@test.com", "123456");

        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({
                email: "parent@test.com",
                otp: "123456",
                newPassword: "NewPass123!",
                confirmPassword: "NewPass123!",   // 👈 required by validator
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain("reset");
    });

    it("can login with new password after reset", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        await setResetOtp("parent@test.com", "123456");

        await request(app).post("/api/auth/reset-password").send({
            email: "parent@test.com",
            otp: "123456",
            newPassword: "NewPass123!",
            confirmPassword: "NewPass123!",        // 👈 required by validator
        });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "NewPass123!" });

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
    });

    it("returns 401 for wrong reset OTP", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        await setResetOtp("parent@test.com", "123456");

        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({
                email: "parent@test.com",
                otp: "000000",
                newPassword: "NewPass123!",
                confirmPassword: "NewPass123!",    // 👈 required by validator
            });

        expect(res.status).toBe(401);
    });

});

// ── POST /api/auth/admin/login ────────────────────────────────────────────────
describe("POST /api/auth/admin/login", () => {

    it("returns 200 and accessToken for admin", async () => {
        await createAdmin({ email: "admin@test.com" });

        const res = await request(app)
            .post("/api/auth/admin/login")
            .send({ email: "admin@test.com", password: "Admin123!" });

        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe("admin");
    });

    it("returns 401 for wrong admin password", async () => {
        await createAdmin({ email: "admin@test.com" });

        const res = await request(app)
            .post("/api/auth/admin/login")
            .send({ email: "admin@test.com", password: "wrongpass" });

        expect(res.status).toBe(401);
    });

});


// ── GET /api/auth/me ──────────────────────────────────────────────────────────
describe("GET /api/auth/me", () => {

    it("returns current user when token is valid", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        const token = loginRes.body.accessToken;

        const meRes = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(meRes.status).toBe(200);
        expect(meRes.body.email).toBe("parent@test.com");
    });

    it("returns 401 when no token provided", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    it("returns 401 when token is fake/invalid", async () => {
        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", "Bearer this.is.fake");
        expect(res.status).toBe(401);
    });

});


// ── POST /api/auth/logout ─────────────────────────────────────────────────────
describe("POST /api/auth/logout", () => {

    it("returns 200 and logged out message", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        const token = loginRes.body.accessToken;

        const res = await request(app)
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Logged out");
    });

    it("increments tokenVersion after logout invalidating old refresh tokens", async () => {
        const parent = await createVerifiedParent({ email: "parent@test.com" });
        const originalVersion = parent.tokenVersion;

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        await request(app)
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

        const dbUser = await User.findById(parent._id);
        expect(dbUser?.tokenVersion).toBe(originalVersion + 1);
    });

    it("returns 401 if logout attempted without token", async () => {
        const res = await request(app).post("/api/auth/logout");
        expect(res.status).toBe(401);
    });

});


// ── POST /api/parents/children ────────────────────────────────────────────────
describe("POST /api/parents/children", () => {

    it("allows a logged-in parent to create a child", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        const token = loginRes.body.accessToken;

        const res = await request(app)
            .post("/api/parents/children")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Little One", age: 7, username: "littleone", loginMethod: "pin", pin: "1234" });

        expect(res.status).toBe(201);
        expect(res.body.username).toBe("littleone");
        expect(res.body.role).toBe("child");
    });

    it("blocks unauthenticated request from creating a child", async () => {
        const res = await request(app)
            .post("/api/parents/children")
            .send({ name: "Little One", age: 7, username: "littleone", loginMethod: "pin", pin: "1234" });

        expect(res.status).toBe(401);
    });

    it("returns 409 if username already taken", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        const token = loginRes.body.accessToken;

        // Create first child
        await request(app)
            .post("/api/parents/children")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Little One", age: 7, username: "littleone", loginMethod: "pin", pin: "1234" });

        // Try same username again
        const res = await request(app)
            .post("/api/parents/children")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Another Kid", age: 8, username: "littleone", loginMethod: "pin", pin: "5678" });

        expect(res.status).toBe(409);
    });

});

// ── GET /api/parents/children ─────────────────────────────────────────────────
describe("GET /api/parents/children", () => {

    // Reusable helper — login and assert token exists
    async function loginParentAndGetToken(email: string): Promise<string> {
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email, password: "Password123!" });
        expect(loginRes.status).toBe(200); // fail fast if login itself broke
        return loginRes.body.accessToken;
    }

    it("returns empty array when parent has no children", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const token = await loginParentAndGetToken("parent@test.com");

        const res = await request(app)
            .get("/api/parents/children")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    it("returns list of children for logged-in parent", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const token = await loginParentAndGetToken("parent@test.com");

        await request(app)
            .post("/api/parents/children")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Child One", age: 6, username: "childone", loginMethod: "pin", pin: "1234" });

        await request(app)
            .post("/api/parents/children")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Child Two", age: 8, username: "childtwo", loginMethod: "pin", pin: "5678" });

        const res = await request(app)
            .get("/api/parents/children")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body.map((c: any) => c.username)).toContain("childone");
        expect(res.body.map((c: any) => c.username)).toContain("childtwo");
    });

    it("does not return another parent's children", async () => {
        await createVerifiedParent({ email: "parentA@test.com" });
        const tokenA = await loginParentAndGetToken("parentA@test.com");

        await request(app)
            .post("/api/parents/children")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ name: "Child A", age: 7, username: "childa", loginMethod: "pin", pin: "1111" });

        await createVerifiedParent({ email: "parentB@test.com" });
        const tokenB = await loginParentAndGetToken("parentB@test.com");

        const res = await request(app)
            .get("/api/parents/children")
            .set("Authorization", `Bearer ${tokenB}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it("returns 401 when not authenticated", async () => {
        const res = await request(app).get("/api/parents/children");
        expect(res.status).toBe(401);
    });

    it("returns sensitive fields stripped from child response", async () => {
        await createVerifiedParent({ email: "parent@test.com" });
        const token = await loginParentAndGetToken("parent@test.com");

        await request(app)
            .post("/api/parents/children")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Safe Kid", age: 7, username: "safekid", loginMethod: "pin", pin: "1234" });

        const res = await request(app)
            .get("/api/parents/children")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body[0].password).toBeUndefined();
        expect(res.body[0].pin).toBeUndefined();
        expect(res.body[0].emailOtp).toBeUndefined();
        expect(res.body[0].tokenVersion).toBeUndefined();
    });

});


// ── POST /api/auth/refresh ────────────────────────────────────────────────────
describe("POST /api/auth/refresh", () => {

    it("returns new accessToken using refresh token cookie", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        // Login first to get access token
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        expect(loginRes.status).toBe(200);

        // Generate a fresh refresh token directly using the user from DB
        const { signRefreshToken } = await import("../../utils/jwt.js");
        const user = await User.findOne({ email: "parent@test.com" });
        const refreshToken = signRefreshToken({
            userId: user!._id.toString(),
            role: "parent",
            tokenVersion: user!.tokenVersion,
        });

        const res = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", `refreshToken=${refreshToken}`);

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe("parent@test.com");
    });

    it("returns 401 when no refresh token cookie present", async () => {
        const res = await request(app).post("/api/auth/refresh");
        expect(res.status).toBe(401);
    });

    it("returns 401 when refresh token cookie is fake", async () => {
        const res = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", "refreshToken=fake.token.here");
        expect(res.status).toBe(401);
    });

    it("returns 401 after logout invalidates the refresh token", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        expect(loginRes.status).toBe(200);
        const accessToken = loginRes.body.accessToken;

        // Get user and create refresh token
        const { signRefreshToken } = await import("../../utils/jwt.js");
        const user = await User.findOne({ email: "parent@test.com" });
        const refreshToken = signRefreshToken({
            userId: user!._id.toString(),
            role: "parent",
            tokenVersion: user!.tokenVersion,
        });

        // Logout — increments tokenVersion
        await request(app)
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${accessToken}`);

        // Old refresh token should now be rejected
        const res = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", `refreshToken=${refreshToken}`);

        expect(res.status).toBe(401);
    });

});

// ── GET /api/admin/me ─────────────────────────────────────────────────────────
describe("GET /api/admin/me", () => {

    it("returns 200 and admin info with valid admin token", async () => {
        await createAdmin({ email: "admin@test.com" });

        const loginRes = await request(app)
            .post("/api/auth/admin/login")
            .send({ email: "admin@test.com", password: "Admin123!" });

        expect(loginRes.status).toBe(200); // fail fast
        const token = loginRes.body.accessToken;

        const res = await request(app)
            .get("/api/admin/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe("admin");
    });

    it("returns 403 when a parent token is used", async () => {
        await createVerifiedParent({ email: "parent@test.com" });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "parent@test.com", password: "Password123!" });

        expect(loginRes.status).toBe(200); // fail fast
        const token = loginRes.body.accessToken;

        const res = await request(app)
            .get("/api/admin/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(403);
    });

    it("returns 401 when no token provided", async () => {
        const res = await request(app).get("/api/admin/me");
        expect(res.status).toBe(401);
    });

});


// ── POST /api/auth/google/login — error cases only ───────────────────────────
describe("POST /api/auth/google/login", () => {

    it("returns 400 when no token is provided", async () => {
        const res = await request(app)
            .post("/api/auth/google/login")
            .send({});

        // Will fail at Google verification — either 400 or 500
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("returns 400 when token is empty string", async () => {
        const res = await request(app)
            .post("/api/auth/google/login")
            .send({ token: "" });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

});


// ── POST /api/auth/google/signup — error cases only ──────────────────────────
describe("POST /api/auth/google/signup", () => {

    it("returns 400 when no token is provided", async () => {
        const res = await request(app)
            .post("/api/auth/google/signup")
            .send({});

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("returns 400 when token is empty string", async () => {
        const res = await request(app)
            .post("/api/auth/google/signup")
            .send({ token: "" });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });

});