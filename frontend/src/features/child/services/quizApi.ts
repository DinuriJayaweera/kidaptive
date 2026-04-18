import api from "../../../services/apiClient";

export async function getDashboardData() {
  const response = await api.get("/quiz/dashboard");
  return response.data;
}
