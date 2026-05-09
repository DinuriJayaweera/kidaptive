import api from '../../../services/apiClient';

export interface UserGrowthPoint {
    date: string;
    parents: number;
    children: number;
}

export interface ActivityPoint {
    date: string;
    quizzes: number;
    xp: number;
}

export interface ScorePoint {
    date: string;
    avgScore: number | null;
}

export interface PlatformHealth {
    apiResponseTimeMs: number;
    dbQueryTimeMs: number;
    memoryUsageMB: number;
    memoryTotalMB: number;
    systemMemoryGB: number;
    systemFreeMemoryGB: number;
    nodeVersion: string;
    uptime: number;
}

export interface RecentActivityItem {
    type: 'practice' | 'quiz_complete' | 'xp_earned';
    childName: string;
    description: string;
    xp?: number;
    score?: number;
    createdAt: string;
}

export interface DashboardStats {
    totalUsers: number;
    newUsersThisWeek: number;
    activeChildrenToday: number;
    quizzesToday: number;
    totalXP: number;
}

export interface DashboardData {
    stats: DashboardStats;
    trends: {
        userGrowth: UserGrowthPoint[];
        activityTrend: ActivityPoint[];
        scoreTrend: ScorePoint[];
    };
    platformHealth: PlatformHealth;
    recentActivity: RecentActivityItem[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
    const { data } = await api.get<DashboardData>('/admin/dashboard');
    return data;
};
