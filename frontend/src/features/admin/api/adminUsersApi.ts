import api from '../../../services/apiClient';

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: 'parent' | 'child' | 'admin';
    isActive: boolean;
    emailVerified: boolean;
    authProvider: 'local' | 'google';
    createdAt: string;
    // parent-specific
    phone?: string;
    avatarUrl?: string;
    // child-specific
    username?: string;
    age?: number;
    parentId?: string;
    parentName?: string;
    totalXP?: number;
    gems?: number;
    streak?: number;
    placementCompleted?: boolean;
    // computed
    childCount?: number;
}

export interface UsersResponse {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: { total: number; parent: number; child: number; admin: number };
}

export interface UserStats {
    total: number;
    active: number;
    suspended: number;
    roles: { parent: number; child: number; admin: number };
    recentSignups: number;
}

export interface GetUsersParams {
    page?: number;
    limit?: number;
    role?: 'all' | 'parent' | 'child' | 'admin';
    status?: 'all' | 'active' | 'suspended';
    search?: string;
}

export const getUserStats = async (): Promise<UserStats> => {
    const { data } = await api.get<UserStats>('/admin/users/stats');
    return data;
};

export const getUsers = async (params: GetUsersParams = {}): Promise<UsersResponse> => {
    const { data } = await api.get<UsersResponse>('/admin/users', { params });
    return data;
};

export const getUserById = async (id: string): Promise<AdminUser> => {
    const { data } = await api.get<AdminUser>(`/admin/users/${id}`);
    return data;
};

export const toggleUserStatus = async (id: string, isActive: boolean): Promise<{ message: string; isActive: boolean }> => {
    const { data } = await api.patch(`/admin/users/${id}/status`, { isActive });
    return data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
};
