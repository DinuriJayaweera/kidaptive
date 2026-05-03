import api from '../../../services/apiClient';

export interface AgeGroupCategory {
    _id: string;
    name: string;
    status: 'active' | 'pending';
    ageGroups: string[];
}

export interface AgeGroupStat {
    ageGroup: string;
    children: number;
    quizQuestions: number;
    placementQuestions: number;
    categories: AgeGroupCategory[];
}

export const getAgeGroupStats = async (): Promise<AgeGroupStat[]> => {
    const { data } = await api.get<AgeGroupStat[]>('/admin/age-groups');
    return data;
};
