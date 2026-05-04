import api from "../../../services/apiClient";

export interface AdminProfile {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    themePreference?: "light" | "dark";
    createdAt: string;
}

export async function getAdminProfile(): Promise<AdminProfile> {
    const res = await api.get("/admin/profile");
    return res.data;
}

export async function updateAdminProfile(data: {
    name: string;
    email: string;
    phone?: string;
    themePreference?: "light" | "dark";
}): Promise<AdminProfile> {
    const res = await api.patch("/admin/profile", data);
    return res.data;
}

export async function changeAdminPassword(data: {
    currentPassword: string;
    newPassword: string;
}): Promise<{ message: string }> {
    const res = await api.patch("/admin/profile/password", data);
    return res.data;
}
