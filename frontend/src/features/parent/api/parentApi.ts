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
