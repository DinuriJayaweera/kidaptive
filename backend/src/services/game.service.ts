import User from "../models/User.js";
import UnlockedGame from "../models/unlockedGame.model.js";
import GameProgress from "../models/gameProgress.model.js";

// ── Game Catalog ─────────────────────────────────────────────────────────────

export interface GameLevel {
    level: number;
    description: string;
    gridSize?: number;
    words: string[];
    gemsReward: number;
}

export interface GameDefinition {
    id: string;
    name: string;
    description: string;
    emoji: string;
    gemCost: number;
    color: string;
    accentColor: string;
    totalLevels: number;
    category: string;
    levels: GameLevel[];
}

export const GAME_CATALOG: GameDefinition[] = [
    {
        id: "word-finder",
        name: "Word Finder",
        description: "Spot hidden words in the letter grid before time runs out!",
        emoji: "🔍",
        gemCost: 100,
        color: "#22C55E",
        accentColor: "#15803D",
        totalLevels: 5,
        category: "vocabulary",
        levels: [
            {
                level: 1,
                description: "4×4 grid · 3-letter words",
                gridSize: 4,
                words: ["CAT", "DOG", "SUN", "HEN"],
                gemsReward: 5,
            },
            {
                level: 2,
                description: "5×5 grid · 4-letter words",
                gridSize: 5,
                words: ["BIRD", "FISH", "FROG", "BEAR", "DUCK"],
                gemsReward: 6,
            },
            {
                level: 3,
                description: "6×6 grid · 5-letter words",
                gridSize: 6,
                words: ["APPLE", "BREAD", "NIGHT", "PLANT", "CLOUD"],
                gemsReward: 7,
            },
            {
                level: 4,
                description: "7×7 grid · 6-letter words",
                gridSize: 7,
                words: ["SCHOOL", "FINGER", "DONKEY", "PENCIL", "WINDOW"],
                gemsReward: 8,
            },
            {
                level: 5,
                description: "8×8 grid · 7-letter words",
                gridSize: 8,
                words: ["RAINBOW", "MORNING", "CHICKEN", "DOLPHIN", "KITCHEN"],
                gemsReward: 10,
            },
        ],
    },
    {
        id: "spelling-challenge",
        name: "Spelling Challenge",
        description: "Study the word, then spell it from memory. Train your brain!",
        emoji: "✏️",
        gemCost: 150,
        color: "#F97316",
        accentColor: "#C2410C",
        totalLevels: 5,
        category: "spelling",
        levels: [
            {
                level: 1,
                description: "Short 3-letter CVC words",
                words: ["CAT", "BAT", "HAT", "MAT", "RAT", "SAT", "BIG", "DIG", "PIG", "HOP"],
                gemsReward: 5,
            },
            {
                level: 2,
                description: "4-letter magic-e words",
                words: ["CAKE", "LAKE", "MAKE", "BAKE", "TAKE", "LATE", "GATE", "KITE", "BITE", "BONE"],
                gemsReward: 6,
            },
            {
                level: 3,
                description: "5-letter vowel words",
                words: ["APPLE", "EAGLE", "UNCLE", "TABLE", "FABLE", "MAPLE", "GRAPE", "SHADE", "BRAVE", "CRANE"],
                gemsReward: 7,
            },
            {
                level: 4,
                description: "6-letter blend words",
                words: ["STREET", "SPRING", "BRIDGE", "BRIGHT", "FRIGHT", "KNIGHT", "CHEESE", "FREEZE", "BREEZE", "BREATH"],
                gemsReward: 8,
            },
            {
                level: 5,
                description: "7-letter challenge words",
                words: ["MORNING", "KITCHEN", "BLANKET", "PENGUIN", "DOLPHIN", "RAINBOW", "JOURNEY", "PICTURE", "CHICKEN", "LANTERN"],
                gemsReward: 10,
            },
        ],
    },
    {
        id: "word-builder",
        name: "Word Builder",
        description: "Tap the scrambled letter tiles in the right order to build the word!",
        emoji: "🏗️",
        gemCost: 200,
        color: "#A855F7",
        accentColor: "#7E22CE",
        totalLevels: 5,
        category: "vocabulary",
        levels: [
            {
                level: 1,
                description: "Build 3-letter words",
                words: ["CAT", "DOG", "SUN", "FUN", "RUN", "BUS", "HOP", "MOP", "TOP", "POT"],
                gemsReward: 5,
            },
            {
                level: 2,
                description: "Build 4-letter words",
                words: ["CAKE", "TREE", "FISH", "DUCK", "FROG", "BIRD", "BEAR", "STAR", "MOON", "RAIN"],
                gemsReward: 6,
            },
            {
                level: 3,
                description: "Build 5-letter words",
                words: ["APPLE", "BREAD", "CLOUD", "GRASS", "NIGHT", "QUEEN", "SMILE", "BRAVE", "PLANT", "GIANT"],
                gemsReward: 7,
            },
            {
                level: 4,
                description: "Build 6-letter words",
                words: ["DRAGON", "FLOWER", "SCHOOL", "FINGER", "DONKEY", "PENCIL", "ROCKET", "BASKET", "CASTLE", "JUNGLE"],
                gemsReward: 8,
            },
            {
                level: 5,
                description: "Build 7-letter words",
                words: ["RAINBOW", "BLANKET", "MORNING", "CHICKEN", "DOLPHIN", "LANTERN", "PENGUIN", "KITCHEN", "JOURNEY", "PICTURE"],
                gemsReward: 10,
            },
        ],
    },
];

// ── Service Functions ─────────────────────────────────────────────────────────

export async function getGamesForChild(childId: string) {
    const [unlockedDocs, progressDocs, child] = await Promise.all([
        UnlockedGame.find({ childId }),
        GameProgress.find({ childId }),
        User.findById(childId).select("gems"),
    ]);

    const unlockedSet = new Set(unlockedDocs.map((u) => u.gameId));
    const progressMap = new Map(progressDocs.map((p) => [p.gameId, p]));

    return {
        gems: child?.gems ?? 0,
        games: GAME_CATALOG.map((game) => {
            const unlocked = unlockedSet.has(game.id);
            const progress = progressMap.get(game.id);
            return {
                id: game.id,
                name: game.name,
                description: game.description,
                emoji: game.emoji,
                gemCost: game.gemCost,
                color: game.color,
                accentColor: game.accentColor,
                totalLevels: game.totalLevels,
                category: game.category,
                unlocked,
                completedLevels: progress?.completedLevels ?? [],
                highestLevel: progress?.highestLevel ?? 0,
                totalGemsEarned: progress?.totalGemsEarned ?? 0,
            };
        }),
    };
}

export async function unlockGame(childId: string, gameId: string) {
    const game = GAME_CATALOG.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found");

    const child = await User.findById(childId);
    if (!child) throw new Error("Child not found");

    const alreadyUnlocked = await UnlockedGame.findOne({ childId, gameId });
    if (alreadyUnlocked) throw new Error("Game already unlocked");

    if ((child.gems ?? 0) < game.gemCost) {
        throw new Error("Not enough gems");
    }

    child.gems = (child.gems ?? 0) - game.gemCost;
    await Promise.all([
        child.save(),
        UnlockedGame.create({ childId, gameId }),
    ]);

    return { newGemBalance: child.gems };
}

export async function getLevelData(gameId: string, level: number) {
    const game = GAME_CATALOG.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found");

    const levelData = game.levels.find((l) => l.level === level);
    if (!levelData) throw new Error("Level not found");

    return { ...levelData, totalLevels: game.totalLevels };
}

export async function submitScore(childId: string, gameId: string, level: number) {
    const game = GAME_CATALOG.find((g) => g.id === gameId);
    if (!game) throw new Error("Game not found");

    // Verify game is unlocked
    const unlocked = await UnlockedGame.findOne({ childId, gameId });
    if (!unlocked) throw new Error("Game not unlocked");

    const levelDef = game.levels.find((l) => l.level === level);
    if (!levelDef) throw new Error("Level not found");

    // Get or create progress
    let progress = await GameProgress.findOne({ childId, gameId });
    if (!progress) {
        progress = new GameProgress({ childId, gameId });
    }

    const isNewLevel = !progress.completedLevels.includes(level);
    let gemsEarned = 0;

    if (isNewLevel) {
        progress.completedLevels.push(level);
        if (level > progress.highestLevel) {
            progress.highestLevel = level;
        }
        gemsEarned = levelDef.gemsReward;
        progress.totalGemsEarned += gemsEarned;

        // Add gems to child's total balance
        await User.findByIdAndUpdate(childId, { $inc: { gems: gemsEarned } });
    }

    await progress.save();

    const child = await User.findById(childId).select("gems");
    return {
        gemsEarned,
        isNewLevel,
        newGemBalance: child?.gems ?? 0,
        completedLevels: progress.completedLevels,
        highestLevel: progress.highestLevel,
    };
}
