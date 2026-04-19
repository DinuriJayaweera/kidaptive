import api from "../../../services/apiClient";

export async function getDashboardData() {
  const response = await api.get("/quiz/dashboard");
  return response.data;
}

export async function startQuiz(categoryId: string) {
  const response = await api.get(`/quiz/start?categoryId=${encodeURIComponent(categoryId)}`);
  return response.data;
}

export async function submitQuiz(categoryId: string, answers: { questionId: string; selectedAnswer: string }[]) {
  const response = await api.post("/quiz/submit", { categoryId, answers });
  return response.data;
}
