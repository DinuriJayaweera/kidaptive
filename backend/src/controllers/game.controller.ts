import { Request, Response } from "express";
import * as gameService from "../services/game.service.js";

// ── GET /api/games ────────────────────────────────────────────────────────────
export const getGames = async (req: Request, res: Response) => {
    try {
        const childId = (req as any).user.userId;
        const data = await gameService.getGamesForChild(childId);
        res.json(data);
    } catch (error) {
        console.error("getGames error:", error);
        res.status(500).json({ message: "Failed to load games." });
    }
};

// ── POST /api/games/unlock ────────────────────────────────────────────────────
export const unlockGame = async (req: Request, res: Response) => {
    try {
        const childId = (req as any).user.userId;
        const { gameId } = req.body;

        if (!gameId || typeof gameId !== "string") {
            return res.status(400).json({ message: "gameId is required." });
        }

        const result = await gameService.unlockGame(childId, gameId);
        res.json({ success: true, ...result });
    } catch (error: any) {
        const msg = error?.message ?? "Failed to unlock game.";
        if (msg === "Not enough gems") return res.status(400).json({ message: msg });
        if (msg === "Game already unlocked") return res.status(409).json({ message: msg });
        if (msg === "Game not found") return res.status(404).json({ message: msg });
        console.error("unlockGame error:", error);
        res.status(500).json({ message: "Failed to unlock game." });
    }
};

// ── GET /api/games/:gameId/levels ─────────────────────────────────────────────
export const getLevelData = async (req: Request, res: Response) => {
    try {
        const gameId = String(req.params.gameId ?? "");
        const rawLevel = req.query.level;
        const level = parseInt(String(Array.isArray(rawLevel) ? rawLevel[0] : (rawLevel ?? "")), 10);

        if (isNaN(level) || level < 1) {
            return res.status(400).json({ message: "Valid level number is required." });
        }

        const data = await gameService.getLevelData(gameId, level);
        res.json(data);
    } catch (error: any) {
        const msg = error?.message ?? "";
        if (msg === "Game not found" || msg === "Level not found") {
            return res.status(404).json({ message: msg });
        }
        console.error("getLevelData error:", error);
        res.status(500).json({ message: "Failed to load level data." });
    }
};

// ── POST /api/games/:gameId/score ─────────────────────────────────────────────
export const submitScore = async (req: Request, res: Response) => {
    try {
        const childId = (req as any).user.userId;
        const gameId = String(req.params.gameId ?? "");
        const { level } = req.body;

        if (typeof level !== "number" || level < 1) {
            return res.status(400).json({ message: "Valid level number is required." });
        }

        const result = await gameService.submitScore(childId, gameId, level);
        res.json(result);
    } catch (error: any) {
        const msg = error?.message ?? "";
        if (msg === "Game not unlocked") return res.status(403).json({ message: msg });
        if (msg === "Game not found" || msg === "Level not found") {
            return res.status(404).json({ message: msg });
        }
        console.error("submitScore error:", error);
        res.status(500).json({ message: "Failed to submit score." });
    }
};
