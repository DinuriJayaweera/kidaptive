import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
            ...(err.errors && { errors: err.errors }),
        });
        return;
    }

    // Mongoose duplicate key
    if ((err as any).code === 11000) {
        res.status(409).json({ message: "This record already exists." });
        return;
    }

    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
}
