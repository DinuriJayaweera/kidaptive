import api from "../../../services/apiClient";

const FILE_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api").replace("/api", "");

export interface ChildStory {
    _id:             string;
    title:           string;
    description:     string;
    coverImagePath?: string;
    pdfPath?:        string;
    createdAt:       string;
}

export function getStoryFileUrl(filename: string): string {
    return `${FILE_BASE}/uploads/stories/${encodeURIComponent(filename)}`;
}

export async function fetchPublishedStories(): Promise<ChildStory[]> {
    const res = await api.get("/child/stories");
    return res.data;
}

export async function fetchStory(id: string): Promise<ChildStory> {
    const res = await api.get(`/child/stories/${id}`);
    return res.data;
}
