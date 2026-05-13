import api from "../../../services/apiClient";

const FILE_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api").replace("/api", "");

export interface Story {
    _id:             string;
    title:           string;
    description:     string;
    coverImagePath?: string;
    pdfPath:         string;
    status:          "published" | "draft";
    createdAt:       string;
    updatedAt:       string;
}

export function getFileUrl(filename: string): string {
    return `${FILE_BASE}/uploads/stories/${encodeURIComponent(filename)}`;
}

export async function getStories(): Promise<Story[]> {
    const res = await api.get("/admin/stories");
    return res.data;
}

export async function createStory(form: FormData): Promise<Story> {
    const res = await api.post("/admin/stories", form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

export async function updateStory(id: string, form: FormData): Promise<Story> {
    const res = await api.put(`/admin/stories/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

export async function deleteStory(id: string): Promise<void> {
    await api.delete(`/admin/stories/${id}`);
}

export async function toggleStatus(id: string): Promise<Story> {
    const res = await api.patch(`/admin/stories/${id}/status`);
    return res.data;
}
