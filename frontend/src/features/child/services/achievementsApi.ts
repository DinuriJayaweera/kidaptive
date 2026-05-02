import api from "../../../services/apiClient";

// ── Types (mirror backend AchievementWithStatus) ──────────────────────────
export type AchievementCategory =
    | "placement"
    | "streak"
    | "quiz"
    | "gem"
    | "accuracy"
    | "champion_badges"  // NEW
    | "special";

export interface Achievement {
    key: string;
    title: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    unlocked: boolean;
    unlockedAt: string | null;
    progress: {
        current: number;
        target: number;
    };
}

export interface AchievementsResponse {
    achievements: Achievement[];
    summary: { unlocked: number; total: number };
    newlyUnlocked: string[];
}

// ── API ────────────────────────────────────────────────────────────────────
export async function getAchievements(): Promise<AchievementsResponse> {
    const res = await api.get("/child/achievements");
    return res.data;
}

export async function evaluateAchievements(): Promise<{ newlyUnlocked: string[] }> {
    const res = await api.post("/child/achievements/evaluate");
    return res.data;
}
