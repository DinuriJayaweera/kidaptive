import { AppError } from "./AppError.js";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET ?? "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

export interface TokenPayload {
    userId: string;
    role: "parent" | "child" | "admin";
    tokenVersion?: number;
}

// ── Access Token ─────────────────────────────────────────────────────────────
export function signAccessToken(payload: Omit<TokenPayload, "tokenVersion">): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

// ── Refresh Token ────────────────────────────────────────────────────────────
export function signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function verifyRefreshToken(token: string): TokenPayload {
    try {
        return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
    } catch {
        throw new AppError("Invalid or expired refresh token", 401);
    }
}