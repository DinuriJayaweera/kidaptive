import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import placementRoutes from "./routes/placement.routes.js";
import placementTestRoutes from "./routes/placement-test.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import parentRoutes from "./routes/parent.routes.js";
import childRoutes from "./routes/child.routes.js";
import gameRoutes from "./routes/game.routes.js";
import adminUsersRoutes from "./routes/adminUsers.routes.js";
import adminPerformanceRoutes from "./routes/adminPerformance.routes.js";
import adminAgeGroupsRoutes from "./routes/adminAgeGroups.routes.js";
import adminProfileRoutes from "./routes/adminProfile.routes.js";
import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
import dailyQuestRoutes from "./routes/dailyQuest.routes.js";
import childDailyQuestRoutes from "./routes/childDailyQuest.routes.js";
import childSessionRoutes from "./routes/childSession.routes.js";
import parentNotificationRoutes from "./routes/parentNotification.routes.js";
import adminNotificationRoutes from "./routes/adminNotification.routes.js";
import childPasswordResetRoutes from "./routes/childPasswordReset.routes.js";
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
app.use("/api/games", gameRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/performance", adminPerformanceRoutes);
app.use("/api/admin/age-groups", adminAgeGroupsRoutes);
app.use("/api/admin/profile", adminProfileRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/daily-quest-questions", dailyQuestRoutes);
app.use("/api/child/daily-quest", childDailyQuestRoutes);
app.use("/api/child/session", childSessionRoutes);
app.use("/api/parent/notifications", parentNotificationRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/child-password-reset", childPasswordResetRoutes);

// ── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

export default app;
