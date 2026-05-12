import api from "../../../services/apiClient";

export interface DailyQuestQuestion {
  _id: string;
  questionText: string;
  type: "mcq" | "fill" | "input" | "boolean";
  category: string;
  difficulty: "easy" | "medium" | "hard";
  options: string[];
}

export interface DailyQuestCompletion {
  score: number;
  correctCount: number;
  xpEarned: number;
  gemsEarned: number;
}

export interface DailyQuestTodayStatus {
  status: "available" | "completed";
  completion?: DailyQuestCompletion;
}

export interface DailyQuestStartResponse {
  questions: DailyQuestQuestion[];
  correctAnswers: Record<string, string>;
  totalQuestions: number;
}

export interface DailyQuestAnswer {
  questionId: string;
  selectedAnswer: string;
  timeTaken: number;
}

export interface DailyQuestSubmitResponse {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  xpEarned: number;
  gemsEarned: number;
  totalXP: number;
  totalGems: number;
}

export const getDailyQuestToday = async (): Promise<DailyQuestTodayStatus> => {
  const { data } = await api.get<DailyQuestTodayStatus>("/child/daily-quest/today");
  return data;
};

export const startDailyQuest = async (): Promise<DailyQuestStartResponse> => {
  const { data } = await api.post<DailyQuestStartResponse>("/child/daily-quest/start");
  return data;
};

export const submitDailyQuest = async (
  answers: DailyQuestAnswer[]
): Promise<DailyQuestSubmitResponse> => {
  const { data } = await api.post<DailyQuestSubmitResponse>("/child/daily-quest/submit", {
    answers,
  });
  return data;
};
