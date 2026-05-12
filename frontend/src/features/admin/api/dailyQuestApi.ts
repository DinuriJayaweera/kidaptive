import api from "../../../services/apiClient";

export type QuestionType = 'mcq' | 'fill' | 'input' | 'boolean';

export interface DailyQuestQuestion {
  _id: string;
  questionText: string;
  ageGroup: string;
  category: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctAnswer: string;
  createdAt: string;
}

export interface FetchQuestionsResponse {
  questions: DailyQuestQuestion[];
  total: number;
  page: number;
  pages: number;
}

export interface DailyQuestStats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

export const getStats = async (): Promise<DailyQuestStats> => {
  const { data } = await api.get<DailyQuestStats>('/daily-quest-questions/stats');
  return data;
};

export const getQuestions = async (params: {
  page?: number;
  limit?: number;
  ageGroup?: string;
  category?: string;
  difficulty?: string;
  search?: string;
}) => {
  const { data } = await api.get<FetchQuestionsResponse>('/daily-quest-questions', { params });
  return data;
};

export const createQuestion = async (payload: Partial<DailyQuestQuestion>) => {
  const { data } = await api.post<DailyQuestQuestion>('/daily-quest-questions', payload);
  return data;
};

export const updateQuestion = async (id: string, payload: Partial<DailyQuestQuestion>) => {
  const { data } = await api.put<DailyQuestQuestion>(`/daily-quest-questions/${id}`, payload);
  return data;
};

export const deleteQuestion = async (id: string) => {
  const { data } = await api.delete(`/daily-quest-questions/${id}`);
  return data;
};
