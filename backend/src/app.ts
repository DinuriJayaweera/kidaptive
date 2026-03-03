import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", healthRoutes);
app.use("/api", authRoutes);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

export default app;