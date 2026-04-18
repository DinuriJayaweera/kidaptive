import api from "../../../services/apiClient";

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
  getStatus: () => api.get<PlacementStatus>("/placement/status"),
  generate: () => api.post<GenerateResponse>("/placement-test/generate"),
  submit: (answers: PlacementAnswer[]) =>
    api.post<SubmitResponse>("/placement-test/submit", { answers }),
  getResults: () => api.get<ResultsResponse>("/placement-test/results"),
  reset: () => api.post("/placement-test/reset"),
};
