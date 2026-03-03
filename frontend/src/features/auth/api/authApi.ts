import api from "../../../services/apiClient";

// ── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    role: "parent" | "child";
    emailVerified: boolean;
    username?: string;
    age?: number;
    avatar?: string;
    loginMethod?: "pin" | "password" | "emoji";
}

export interface ChildProfile {
    _id: string;
    name: string;
    username: string;
    age: number;
    avatar: string;
    loginMethod: "pin" | "password" | "emoji";
}

interface AuthResponse {
    success?: boolean;
    remainingAttempts?: number;
    message: string;
    user?: AuthUser;
    accessToken?: string;
}

interface SignupResponse {
    message: string;
    user: AuthUser;
}

interface LoginResult {
    requiresVerification?: boolean;
    message: string;
    email?: string;
    user?: AuthUser;
    accessToken?: string;
}

// ── Parent Auth ──────────────────────────────────────────────────────────────
export async function parentSignup(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}): Promise<SignupResponse> {
    const res = await api.post("/auth/signup", data);
    return res.data;
}

export async function verifyEmailOtp(data: {
    email: string;
    otp: string;
}): Promise<AuthResponse> {
    const res = await api.post("/auth/verify-email", data);
    return res.data;
}

export async function resendOtp(data: { email: string }): Promise<{ message: string }> {
    const res = await api.post("/auth/resend-otp", data);
    return res.data;
}

export async function parentLogin(data: {
    email: string;
    password: string;
}): Promise<LoginResult> {
    const res = await api.post("/auth/login", data);
    return res.data;
}

export async function forgotPassword(data: { email: string }): Promise<{ message: string }> {
    const res = await api.post("/auth/forgot-password", data);
    return res.data;
}

export async function resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}): Promise<{ message: string }> {
    const res = await api.post("/auth/reset-password", data);
    return res.data;
}

// ── Token Management ─────────────────────────────────────────────────────────
export async function refreshToken(): Promise<{ accessToken: string; user: AuthUser }> {
    const res = await api.post("/auth/refresh");
    return res.data;
}

export async function logout(): Promise<void> {
    await api.post("/auth/logout");
}

export async function getMe(): Promise<AuthUser> {
    const res = await api.get("/auth/me");
    return res.data;
}

// ── Child Auth ───────────────────────────────────────────────────────────────
export async function childLogin(data: {
    username: string;
    pin?: string;
    password?: string;
    emojiPassword?: string;
}): Promise<AuthResponse> {
    const res = await api.post("/auth/child/login", data);
    return res.data;
}

// ── Children Management ──────────────────────────────────────────────────────
export async function createChild(data: {
    name: string;
    age: number;
    username: string;
    avatar?: string;
    loginMethod: "pin" | "password" | "emoji";
    pin?: string;
    password?: string;
    emojiPassword?: string;
}): Promise<ChildProfile> {
    const res = await api.post("/parents/children", data);
    return res.data;
}

export async function getMyChildren(): Promise<ChildProfile[]> {
    const res = await api.get("/parents/children");
    return res.data;
}
