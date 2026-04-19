import api from "../../../services/apiClient";

export type QuestionType = 'mcq' | 'fill' | 'input' | 'boolean';

export interface QuizQuestion {
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
  questions: QuizQuestion[];
  total: number;
  page: number;
  pages: number;
}

export interface QuizStats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

export const getStats = async (): Promise<QuizStats> => {
  const { data } = await api.get<QuizStats>('/quiz/questions/stats');
  return data;
};

export const getQuestions = async (params: { page?: number; limit?: number; ageGroup?: string; category?: string; difficulty?: string; search?: string }) => {
  const { data } = await api.get<FetchQuestionsResponse>('/quiz/questions', { params });
  return data;
};

export const createQuestion = async (payload: Partial<QuizQuestion>) => {
  const { data } = await api.post<QuizQuestion>('/quiz/questions', payload);
  return data;
};

export const updateQuestion = async (id: string, payload: Partial<QuizQuestion>) => {
  const { data } = await api.put<QuizQuestion>(`/quiz/questions/${id}`, payload);
  return data;
};

export const deleteQuestion = async (id: string) => {
  const { data } = await api.delete(`/quiz/questions/${id}`);
  return data;
};
