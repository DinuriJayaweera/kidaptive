import api from "../../../services/apiClient";

const FILE_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api").replace("/api", "");

export interface MusicTrack {
    _id:             string;
    title:           string;
    description:     string;
    artist?:         string;
    coverImagePath?: string;
    audioPath?:      string;
    videoPath?:      string;
    status:          "published" | "draft";
    createdAt:       string;
}

export function getMusicFileUrl(filename: string): string {
    return `${FILE_BASE}/uploads/music/${encodeURIComponent(filename)}`;
}

export async function getMusic(): Promise<MusicTrack[]> {
    const res = await api.get("/admin/music");
    return res.data;
}

export async function createMusic(fd: FormData): Promise<MusicTrack> {
    const res = await api.post("/admin/music", fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

export async function updateMusic(id: string, fd: FormData): Promise<MusicTrack> {
    const res = await api.put(`/admin/music/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

export async function deleteMusic(id: string): Promise<void> {
    await api.delete(`/admin/music/${id}`);
}

export async function toggleMusicStatus(id: string): Promise<MusicTrack> {
    const res = await api.patch(`/admin/music/${id}/status`);
    return res.data;
}
