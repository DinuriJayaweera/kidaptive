import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { authenticate, requireRole } from "./middleware/auth.middleware.js";
import { userPlacementStatus } from "./controllers/placement-test.controller.js";

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
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

import placementRoutes from "./routes/placement.routes.js";
import placementTestRoutes from "./routes/placement-test.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import parentRoutes from "./routes/parent.routes.js";
import childRoutes from "./routes/child.routes.js";

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/placement-questions", placementRoutes);
app.use("/api/placement-test", placementTestRoutes);
app.get("/api/placement/status", authenticate, requireRole("child"), userPlacementStatus);
app.use("/api/categories", categoryRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/child", childRoutes);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

export default app;