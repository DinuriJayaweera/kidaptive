import api from "../../../services/apiClient";

export interface PublicRating {
    rating: number;
    feedback?: string;
    firstName: string;
    createdAt: string;
}

export async function getRatingPromptStatus(): Promise<{ shouldShow: boolean }> {
    const res = await api.get("/parent/rating/prompt-status");
    return res.data;
}

export async function submitRating(data: { rating: number; feedback?: string }): Promise<void> {
    await api.post("/parent/rating", data);
}

export async function notNowRating(): Promise<void> {
    await api.post("/parent/rating/not-now");
}

export async function neverAskRating(): Promise<void> {
    await api.post("/parent/rating/never-ask");
}

export async function getPublicRatings(): Promise<PublicRating[]> {
    const res = await api.get("/ratings/public");
    return res.data;
}
