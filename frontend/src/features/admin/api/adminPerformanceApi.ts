import api from '../../../services/apiClient';

export interface PerformanceStat {
    totalActiveUsers: number;
    avgPlacementScore: number;
    completionRate: number;
    weeklyQuizzesTaken: number;
}

export interface AgeGroupPerformance {
    ageGroup: string;
    avgScore: number;
    count: number;
}

export interface MostAttemptedCategory {
    categoryName: string;
    totalAttempts: number;
    passRate: number;
}

export interface WeakCategory {
    categoryName: string;
    avgScore: number;
}

export interface PerformanceData {
    stats: PerformanceStat;
    performanceByAgeGroup: AgeGroupPerformance[];
    mostAttemptedCategories: MostAttemptedCategory[];
    weakCategories: WeakCategory[];
}

export const getPerformanceData = async (): Promise<PerformanceData> => {
    const { data } = await api.get<PerformanceData>('/admin/performance');
    return data;
};
