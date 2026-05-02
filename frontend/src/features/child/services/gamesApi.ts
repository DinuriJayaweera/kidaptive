import api from "../../../services/apiClient";

export interface GameLevelData {
    level: number;
    description: string;
    gridSize?: number;
    words: string[];
    gemsReward: number;
    totalLevels: number;
}

export interface GameCard {
    id: string;
    name: string;
    description: string;
    emoji: string;
    gemCost: number;
    color: string;
    accentColor: string;
    totalLevels: number;
    category: string;
    unlocked: boolean;
    completedLevels: number[];
    highestLevel: number;
    totalGemsEarned: number;
}

export interface GamesResponse {
    gems: number;
    games: GameCard[];
}

export async function getGames(): Promise<GamesResponse> {
    const res = await api.get("/games");
    return res.data;
}

export async function unlockGame(gameId: string): Promise<{ success: boolean; newGemBalance: number }> {
    const res = await api.post("/games/unlock", { gameId });
    return res.data;
}

export async function getLevelData(gameId: string, level: number): Promise<GameLevelData> {
    const res = await api.get(`/games/${gameId}/levels?level=${level}`);
    return res.data;
}

export async function submitScore(gameId: string, level: number): Promise<{
    gemsEarned: number;
    isNewLevel: boolean;
    newGemBalance: number;
    completedLevels: number[];
    highestLevel: number;
}> {
    const res = await api.post(`/games/${gameId}/score`, { level });
    return res.data;
}
