import api from '../../../services/apiClient';

export interface Category {
  _id: string;
  name: string;
  status: 'active' | 'pending';
  ageGroups: string[];
  placementCount: number;
  quizCount: number;
  totalCount: number;
  createdAt: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[]>('/categories');
  return data;
};

export const createCategory = async (payload: { name: string; status: 'active' | 'pending'; ageGroups: string[] }): Promise<Category> => {
  const { data } = await api.post<Category>('/categories', payload);
  return data;
};

export const updateCategory = async (id: string, payload: Partial<{ name: string; status: 'active' | 'pending'; ageGroups: string[] }>): Promise<Category> => {
  const { data } = await api.put<Category>(`/categories/${id}`, payload);
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
};

