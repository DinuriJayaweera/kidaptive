import api from "../../../services/apiClient";

const FILE_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api").replace("/api", "");

export interface ChildTrack {
    _id:             string;
    title:           string;
    description:     string;
    artist?:         string;
    coverImagePath?: string;
    audioPath?:      string;
    videoPath?:      string;
    createdAt:       string;
}

export function getMusicFileUrl(filename: string): string {
    return `${FILE_BASE}/uploads/music/${encodeURIComponent(filename)}`;
}

export async function fetchPublishedMusic(): Promise<ChildTrack[]> {
    const res = await api.get("/child/music");
    return res.data;
}
