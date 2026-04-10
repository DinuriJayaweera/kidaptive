import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type QuestionType = 'mcq' | 'fill' | 'input' | 'boolean';

export interface PlacementQuestion {
  _id: string;
  questionText: string;
  type: QuestionType;
  category: string;
  difficulty: string;
  options: string[];
}

export interface PlacementAnswer {
  questionId: string;
  categoryId: string;
  difficulty: string;
  selectedAnswer: string;
  timeTaken: number;
}

export interface CategoryResult {
  categoryId: string;
  score: number;
  level: "starter" | "explorer" | "champion";
}

export interface PlacementStatus {
  placementCompleted: boolean;
  evaluatedCategories: string[];
  totalCategories: number;
  remainingCategories: string[];
}

export interface GenerateResponse {
  questions: PlacementQuestion[];
  categories: string[];
  testNumber: number;
  totalCategories: number;
  correctAnswers: Record<string, string>; // questionId → correctAnswer
}

export interface SubmitResponse {
  categoryResults: CategoryResult[];
  allCompleted: boolean;
  evaluatedCategories: string[];
}

export interface ResultsResponse {
  categoryResults: CategoryResult[];
  evaluatedCategories: string[];
  placementCompleted: boolean;
}

export const placementTestApi = {
  getStatus: () => API.get<PlacementStatus>("/placement-test/status"),
  generate: () => API.post<GenerateResponse>("/placement-test/generate"),
  submit: (answers: PlacementAnswer[]) =>
    API.post<SubmitResponse>("/placement-test/submit", { answers }),
  getResults: () => API.get<ResultsResponse>("/placement-test/results"),
  reset: () => API.post("/placement-test/reset"),
};
