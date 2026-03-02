import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type TokenPayload } from "../utils/jwt.js";

// ── Authenticate — verify access token from Authorization header ─────────────
export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    try {
        (req as Request & { user: TokenPayload }).user = verifyAccessToken(header.split(" ")[1]);
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}

// ── Require specific role(s) ─────────────────────────────────────────────────
export function requireRole(...roles: Array<"parent" | "child">) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as Request & { user?: TokenPayload }).user;
        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        next();
    };
}
