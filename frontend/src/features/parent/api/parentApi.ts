import api from "../../../services/apiClient";

export interface ChildCategoryProgress {
    categoryId: string;
    level: "starter" | "explorer" | "champion";
    xp: number;
    xpToNextLevel: number;
    quizzesCompleted: number;
}

export interface PlacementCategoryResult {
    categoryId: string;
    score: number;
    assignedLevel: "starter" | "explorer" | "champion";
}

export interface ActivityTimelineItem {
    id: string;
    time: string;
    description: string;
}

export interface ActivitySummary {
    today: {
        startTime: string | null;
        endTime: string | null;
        totalLearningSeconds: number;
        quizzesCompleted: number;
        xpEarned: number;
    };
    weekly: {
        totalLearningSeconds: number;
        quizzesCompleted: number;
        streak: number;
    };
    insights: {
        mostPracticedCategory: string | null;
        bestScoreThisWeek: number | null;
        averageDailyLearningSeconds: number;
    };
    timeline: ActivityTimelineItem[];
    dailyQuestSummary?: {
        todayCompleted: boolean;
        todayScore?: number;
        todayXP?: number;
        todayGems?: number;
        weeklyCompleted: number;
        totalCompleted: number;
    };
}

export interface EnhancedChildProfile {
    childId: string;
    name: string;
    age: number;
    avatar: string;
    totalXP: number;
    gems: number;
    streak: number;
    lastPlayedDate: string | null;
    createdAt: string;
    categories: ChildCategoryProgress[];
    placementCompleted?: boolean;
    placementResults?: PlacementCategoryResult[];
    activitySummary?: ActivitySummary;
}

export const getParentChildrenEnriched = async (): Promise<EnhancedChildProfile[]> => {
    const res = await api.get("/parent/children");
    return res.data;
};

export const getChildProgress = async (childId: string): Promise<EnhancedChildProfile> => {
    const res = await api.get(`/parent/child/${childId}/progress`);
    return res.data;
};

export const updateChild = async (childId: string, data: { name?: string; age?: number; avatar?: string }) => {
    const res = await api.put(`/parent/child/${childId}`, data);
    return res.data;
};

export const deleteChild = async (childId: string) => {
    const res = await api.delete(`/parent/child/${childId}`);
    return res.data;
};

// ── Parent Profile & Settings ────────────────────────────────────────────────
export interface ParentProfile {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    memberSince: string;
    emailVerified: boolean;
    authProvider: "local" | "google";
    themePreference: "light" | "dark" | "system";
    notificationSettings: {
        emailNotifications: boolean;
        learningReminders: boolean;
        progressReports: boolean;
        weeklyDigest: boolean;
    };
    monitoringSettings: {
        trackScreenTime: boolean;
        dailyLimitMinutes: number;
        contentFiltering: boolean;
        activityAlerts: boolean;
    };
    timezone: string;
    dateFormat: string;
    childCount: number;
}

export const getParentProfile = async (): Promise<ParentProfile> => {
    const res = await api.get("/parent/profile");
    return res.data;
};

export const updateParentProfile = async (data: Partial<Omit<ParentProfile, "_id" | "email" | "memberSince" | "emailVerified" | "authProvider" | "childCount">>): Promise<{ message: string; profile: ParentProfile }> => {
    const res = await api.patch("/parent/profile", data);
    return res.data;
};

export const uploadParentAvatar = async (avatarData: string): Promise<{ message: string; avatarUrl: string }> => {
    const res = await api.post("/parent/avatar", { avatarData });
    return res.data;
};

export const changeParentPassword = async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const res = await api.post("/parent/change-password", data);
    return res.data;
};

export const deleteParentAccount = async (confirmation: string): Promise<{ message: string }> => {
    const res = await api.delete("/parent/account", { data: { confirmation } });
    return res.data;
};
