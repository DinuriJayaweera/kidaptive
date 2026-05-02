import api from "../../../services/apiClient";

export async function getDashboardData() {
  const response = await api.get("/quiz/dashboard");
  return response.data;
}

export async function startQuiz(categoryId: string, targetLevel?: string) {
  let url = `/quiz/start?categoryId=${encodeURIComponent(categoryId)}`;
  if (targetLevel) url += `&targetLevel=${encodeURIComponent(targetLevel)}`;
  const response = await api.get(url);
  return response.data;
}

export async function submitQuiz(categoryId: string, answers: { questionId: string; selectedAnswer: string; timeTaken?: number }[], targetLevel?: string, isReplay?: boolean) {
  const response = await api.post("/quiz/submit", { categoryId, answers, targetLevel, isReplay });
  return response.data;
}

export async function getCategoryProgress(categoryId: string) {
  const response = await api.get(`/quiz/progress/${encodeURIComponent(categoryId)}`);
  return response.data;
}
