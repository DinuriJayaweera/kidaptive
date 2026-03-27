import api from "../../../services/apiClient";

export interface PlacementQuestion {
  _id: string;
  questionText: string;
  ageGroup: string;
  category: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  createdAt: string;
}

export interface FetchQuestionsResponse {
  questions: PlacementQuestion[];
  total: number;
  page: number;
  pages: number;
}

export const getQuestions = async (params: { page?: number; limit?: number; ageGroup?: string; category?: string; search?: string }) => {
  const { data } = await api.get<FetchQuestionsResponse>('/placement-questions', { params });
  return data;
};

export const createQuestion = async (payload: Partial<PlacementQuestion>) => {
  const { data } = await api.post<PlacementQuestion>('/placement-questions', payload);
  return data;
};

export const updateQuestion = async (id: string, payload: Partial<PlacementQuestion>) => {
  const { data } = await api.put<PlacementQuestion>(`/placement-questions/${id}`, payload);
  return data;
};

export const deleteQuestion = async (id: string) => {
  const { data } = await api.delete(`/placement-questions/${id}`);
  return data;
};
