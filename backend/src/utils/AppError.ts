// ── Custom App Error ────────────────────────────────────────────────────────
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly errors?: { field: string; message: string }[];

    constructor(
        message: string,
        statusCode: number,
        errors?: { field: string; message: string }[],
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

// ── Factory helpers ─────────────────────────────────────────────────────────
export const BadRequest = (msg: string, errors?: { field: string; message: string }[]) =>
    new AppError(msg, 400, errors);

export const Unauthorized = (msg = "Unauthorized") =>
    new AppError(msg, 401);

export const Forbidden = (msg = "Forbidden") =>
    new AppError(msg, 403);

export const NotFound = (msg = "Not found") =>
    new AppError(msg, 404);

export const Conflict = (msg: string) =>
    new AppError(msg, 409);

export const TooManyRequests = (msg = "Too many requests") =>
    new AppError(msg, 429);
