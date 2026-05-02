import { useEffect, useState, useCallback, useRef } from "react";
import { Box, Typography, Button, CircularProgress, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChildSidebar from "../../components/ChildSidebar";
import TopBarStats from "../../components/TopBarStats";
import { getLevelData, submitScore, getGames } from "../../services/gamesApi";
import { getDashboardData } from "../../services/quizApi";
import gameIcon from "../../../../assets/wordfinder.png";

// ── Grid generation ──────────────────────────────────────────────────────────

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIRECTIONS = [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // diagonal down-right
    [-1, 1],  // diagonal up-right
];

interface WordPlacement {
    word: string;
    cells: [number, number][];
}

function tryPlaceWord(
    grid: string[][],
    word: string,
    size: number,
    placements: WordPlacement[],
): boolean {
    const dirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

    for (const [dr, dc] of dirs) {
        for (let attempt = 0; attempt < 200; attempt++) {
            const row = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);
            const endRow = row + dr * (word.length - 1);
            const endCol = col + dc * (word.length - 1);
            if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
                const existing = grid[row + dr * i][col + dc * i];
                if (existing !== "" && existing !== word[i]) { canPlace = false; break; }
            }
            if (canPlace) {
                const cells: [number, number][] = [];
                for (let i = 0; i < word.length; i++) {
                    grid[row + dr * i][col + dc * i] = word[i];
                    cells.push([row + dr * i, col + dc * i]);
                }
                placements.push({ word, cells });
                return true;
            }
        }
    }

    // Random placement failed — scan every horizontal slot without overwriting
    for (let r = 0; r < size; r++) {
        for (let c = 0; c <= size - word.length; c++) {
            let ok = true;
            for (let i = 0; i < word.length; i++) {
                const existing = grid[r][c + i];
                if (existing !== "" && existing !== word[i]) { ok = false; break; }
            }
            if (ok) {
                const cells: [number, number][] = [];
                for (let i = 0; i < word.length; i++) {
                    grid[r][c + i] = word[i];
                    cells.push([r, c + i]);
                }
                placements.push({ word, cells });
                return true;
            }
        }
    }

    // Try vertical scan
    for (let c = 0; c < size; c++) {
        for (let r = 0; r <= size - word.length; r++) {
            let ok = true;
            for (let i = 0; i < word.length; i++) {
                const existing = grid[r + i][c];
                if (existing !== "" && existing !== word[i]) { ok = false; break; }
            }
            if (ok) {
                const cells: [number, number][] = [];
                for (let i = 0; i < word.length; i++) {
                    grid[r + i][c] = word[i];
                    cells.push([r + i, c]);
                }
                placements.push({ word, cells });
                return true;
            }
        }
    }

    return false; // genuinely can't fit — skip word rather than corrupt grid
}

function buildGrid(words: string[], size: number): { grid: string[][]; placements: WordPlacement[] } {
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
    const placements: WordPlacement[] = [];

    // Shuffle so no single word is always the one that gets force-placed
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    for (const word of shuffled) {
        tryPlaceWord(grid, word, size, placements);
    }

    // Fill empties
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (!grid[r][c]) {
                grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            }
        }
    }

    return { grid, placements };
}

function cellKey(r: number, c: number) {
    return `${r}-${c}`;
}

// ── Game ─────────────────────────────────────────────────────────────────────

const GAME_ID = "word-finder";
const GAME_COLOR = "#22C55E";
const GAME_ACCENT = "#15803D";
const TOTAL_LEVELS = 5;

type GamePhase = "level-select" | "playing" | "level-complete" | "game-complete";

export default function WordFinderGame() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({ totalXp: 0, streak: 0, gems: 0 });
    const [phase, setPhase] = useState<GamePhase>("level-select");
    const [currentLevel, setCurrentLevel] = useState(1);
    const [completedLevels, setCompletedLevels] = useState<number[]>([]);
    const [highestLevel, setHighestLevel] = useState(0);
    const [gemsEarned, setGemsEarned] = useState(0);
    const [totalGemsThisSession, setTotalGemsThisSession] = useState(0);
    const [loadingLevel, setLoadingLevel] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [levelDesc, setLevelDesc] = useState("");
    const [levelGemsReward, setLevelGemsReward] = useState(5);

    // Grid state
    const [grid, setGrid] = useState<string[][]>([]);
    const [placements, setPlacements] = useState<WordPlacement[]>([]);
    const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
    const [wrongFlash, setWrongFlash] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);
    // Refs mirror drag state to avoid stale closures in mouseup handler
    const selectingRef = useRef(false);
    const selectedRef = useRef<Set<string>>(new Set());
    const selectionStartRef = useRef<[number, number] | null>(null);
    const placementsRef = useRef<WordPlacement[]>([]);
    const foundWordsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        Promise.allSettled([getDashboardData(), getGames()]).then(([dashResult, gamesResult]) => {
            if (dashResult.status === "fulfilled" && dashResult.value?.stats) {
                setStats(dashResult.value.stats);
            }
            if (gamesResult.status === "fulfilled") {
                const myGame = gamesResult.value.games.find((g) => g.id === GAME_ID);
                if (myGame) {
                    setCompletedLevels(myGame.completedLevels);
                    setHighestLevel(myGame.highestLevel);
                    setStats((s) => ({ ...s, gems: gamesResult.value.gems }));
                }
            }
        });
    }, []);

    const loadLevel = useCallback(async (level: number) => {
        setLoadingLevel(true);
        try {
            const data = await getLevelData(GAME_ID, level);
            setLevelDesc(data.description);
            setLevelGemsReward(data.gemsReward);
            const { grid: g, placements: p } = buildGrid(data.words, data.gridSize ?? 5);
            setGrid(g);
            setPlacements(p);
            placementsRef.current = p;
            setFoundWords(new Set());
            foundWordsRef.current = new Set();
            setSelected(new Set());
            selectedRef.current = new Set();
            setSelectionStart(null);
            selectionStartRef.current = null;
            setSelecting(false);
            selectingRef.current = false;
            setPhase("playing");
        } catch (err) {
            console.error("Failed to load level:", err);
        } finally {
            setLoadingLevel(false);
        }
    }, []);

    const startLevel = (level: number) => {
        setCurrentLevel(level);
        loadLevel(level);
    };

    // Compute cells along a straight line from start to end
    const getCellsInLine = (start: [number, number], end: [number, number]): [number, number][] => {
        const [r1, c1] = start;
        const [r2, c2] = end;
        const dr = r2 - r1;
        const dc = c2 - c1;

        // Must be straight line (horizontal, vertical, or exact diagonal)
        const absDr = Math.abs(dr);
        const absDc = Math.abs(dc);
        if (absDr !== 0 && absDc !== 0 && absDr !== absDc) return [];

        const steps = Math.max(absDr, absDc);
        if (steps === 0) return [start];

        const stepR = dr === 0 ? 0 : dr / absDr;
        const stepC = dc === 0 ? 0 : dc / absDc;
        const cells: [number, number][] = [];
        for (let i = 0; i <= steps; i++) {
            cells.push([r1 + stepR * i, c1 + stepC * i]);
        }
        return cells;
    };

    const handleCellMouseDown = (r: number, c: number) => {
        const start: [number, number] = [r, c];
        const initial = new Set([cellKey(r, c)]);
        selectingRef.current = true;
        selectionStartRef.current = start;
        selectedRef.current = initial;
        setSelecting(true);
        setSelectionStart(start);
        setSelected(initial);
    };

    const handleCellMouseEnter = (r: number, c: number) => {
        if (!selectingRef.current || !selectionStartRef.current) return;
        const line = getCellsInLine(selectionStartRef.current, [r, c]);
        const newSelected = new Set(line.map(([lr, lc]) => cellKey(lr, lc)));
        selectedRef.current = newSelected;
        setSelected(newSelected);
    };

    const handleMouseUp = () => {
        if (!selectingRef.current || selectedRef.current.size === 0) {
            selectingRef.current = false;
            setSelecting(false);
            return;
        }
        selectingRef.current = false;
        setSelecting(false);

        // Read from refs to avoid stale closures
        const selectedArr = Array.from(selectedRef.current);
        const currentPlacements = placementsRef.current;
        const currentFound = foundWordsRef.current;

        const match = currentPlacements.find((p) => {
            if (p.cells.length !== selectedArr.length) return false;
            const placementKeys = new Set(p.cells.map(([r, c]) => cellKey(r, c)));
            return selectedArr.every((k) => placementKeys.has(k));
        });

        if (match && !currentFound.has(match.word)) {
            const newFound = new Set([...currentFound, match.word]);
            foundWordsRef.current = newFound;
            setFoundWords(newFound);
            selectedRef.current = new Set();
            setSelected(new Set());

            if (newFound.size === currentPlacements.length) {
                handleLevelComplete();
            }
        } else {
            setWrongFlash(true);
            setTimeout(() => {
                setWrongFlash(false);
                selectedRef.current = new Set();
                setSelected(new Set());
            }, 500);
        }
    };

    const handleLevelComplete = async () => {
        setSubmitting(true);
        try {
            const result = await submitScore(GAME_ID, currentLevel);
            setGemsEarned(result.gemsEarned);
            setTotalGemsThisSession((prev) => prev + result.gemsEarned);
            setStats((s) => ({ ...s, gems: result.newGemBalance }));
            setCompletedLevels(result.completedLevels);
            setHighestLevel(result.highestLevel);

            if (currentLevel === TOTAL_LEVELS) {
                setPhase("game-complete");
            } else {
                setPhase("level-complete");
            }
        } catch (err) {
            console.error("Score submit failed:", err);
            setPhase("level-complete");
        } finally {
            setSubmitting(false);
        }
    };

    // Keep refs in sync with state for use in mouseup handler
    placementsRef.current = placements;
    foundWordsRef.current = foundWords;

    // Cell state helpers
    const isCellFound = (r: number, c: number) => {
        return placements.some(
            (p) => foundWords.has(p.word) && p.cells.some(([pr, pc]) => pr === r && pc === c)
        );
    };
    const isCellSelected = (r: number, c: number) => selected.has(cellKey(r, c));

    // ── Render: Level Select ──────────────────────────────────────────────────
    if (phase === "level-select") {
        return (
            <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
                <ChildSidebar activePage="MORE" />
                <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 } }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                        <TopBarStats totalXp={stats.totalXp} streak={stats.streak} gems={stats.gems} />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                        <Button onClick={() => navigate("/child/games")} sx={{ color: "#64748B", fontFamily: "'Poppins', sans-serif", textTransform: "none", fontWeight: 600 }}>
                            ← Back
                        </Button>
                    </Box>

                    <Box sx={{ backgroundColor: "#fff", borderRadius: "24px", border: "2px solid #E8ECF1", p: { xs: 2.5, sm: 4 }, mb: 4, textAlign: "center" }}>
                        <Box component="img" src={gameIcon} alt="Word Finder" sx={{ width: { xs: 80, sm: 100 }, height: { xs: 80, sm: 100 }, objectFit: "contain", mb: 1 }} />
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: { xs: "1.8rem", sm: "2.4rem" }, color: "#1A202C" }}>
                            Word Finder
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", color: "#64748B", mt: 0.5 }}>
                            Find all the hidden words in the grid!
                        </Typography>
                    </Box>

                    <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#1A202C", mb: 2 }}>
                        Choose a Level
                    </Typography>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((lvl) => {
                            const isCompleted = completedLevels.includes(lvl);
                            const isNext = lvl === highestLevel + 1 || (highestLevel === 0 && lvl === 1);
                            const isLocked = lvl > highestLevel + 1 && highestLevel > 0;

                            return (
                                <Box
                                    key={lvl}
                                    onClick={() => !isLocked && startLevel(lvl)}
                                    sx={{
                                        backgroundColor: isCompleted ? GAME_COLOR : isNext ? "#fff" : "#F8FAFF",
                                        border: `2px solid ${isCompleted ? GAME_ACCENT : isNext ? GAME_COLOR : "#E2E8F0"}`,
                                        borderRadius: "20px",
                                        p: 2.5,
                                        textAlign: "center",
                                        cursor: isLocked ? "not-allowed" : "pointer",
                                        opacity: isLocked ? 0.5 : 1,
                                        transition: "all 0.2s",
                                        "&:hover": !isLocked ? { transform: "translateY(-3px)", boxShadow: `0 8px 20px ${GAME_COLOR}30` } : {},
                                    }}
                                >
                                    <Typography sx={{ fontSize: "2rem", mb: 0.5 }}>
                                        {isCompleted ? "⭐" : isLocked ? "🔒" : "🔍"}
                                    </Typography>
                                    <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: isCompleted ? "#fff" : "#1A202C" }}>
                                        Level {lvl}
                                    </Typography>
                                    {isCompleted && (
                                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.7rem", color: "#fff", fontWeight: 600 }}>
                                            Completed!
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        );
    }

    // ── Render: Level Complete ────────────────────────────────────────────────
    if (phase === "level-complete" || phase === "game-complete") {
        return (
            <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
                <ChildSidebar activePage="MORE" />
                <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 }, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
                    <Box
                        sx={{
                            backgroundColor: "#fff",
                            borderRadius: "28px",
                            border: `2px solid ${GAME_COLOR}40`,
                            p: { xs: 3, sm: 5 },
                            textAlign: "center",
                            maxWidth: 420,
                            width: "100%",
                            boxShadow: `0 16px 48px ${GAME_COLOR}20`,
                        }}
                    >
                        <Typography sx={{ fontSize: "4rem", mb: 1 }}>
                            {phase === "game-complete" ? "🏆" : "🎉"}
                        </Typography>
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#1A202C", mb: 0.5 }}>
                            {phase === "game-complete" ? "All Done!" : "Level Complete!"}
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", color: "#64748B", mb: 3 }}>
                            {phase === "game-complete"
                                ? "You completed all Word Finder levels! Amazing work!"
                                : `You found all the words in Level ${currentLevel}!`}
                        </Typography>

                        {gemsEarned > 0 && (
                            <Box sx={{ backgroundColor: "rgba(37,175,244,0.08)", border: "2px solid rgba(37,175,244,0.25)", borderRadius: "16px", p: 2, mb: 3 }}>
                                <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "#25AFF4" }}>
                                    💎 +{gemsEarned} Gems!
                                </Typography>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem", color: "#0369A1", fontWeight: 600 }}>
                                    New level bonus — added to your total!
                                </Typography>
                            </Box>
                        )}
                        {gemsEarned === 0 && (
                            <Box sx={{ backgroundColor: "rgba(100,116,139,0.06)", borderRadius: "16px", p: 2, mb: 3 }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.85rem", color: "#64748B" }}>
                                    You've already earned gems for this level!
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                            {phase !== "game-complete" && (
                                <Button
                                    onClick={() => startLevel(currentLevel + 1)}
                                    variant="contained"
                                    sx={{
                                        borderRadius: "30px", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, textTransform: "none", fontSize: "1rem",
                                        background: `linear-gradient(135deg, ${GAME_COLOR}, ${GAME_ACCENT})`,
                                        px: 3, boxShadow: `0 4px 12px ${GAME_COLOR}40`,
                                    }}
                                >
                                    Next Level →
                                </Button>
                            )}
                            <Button
                                onClick={() => setPhase("level-select")}
                                variant="outlined"
                                sx={{
                                    borderRadius: "30px", fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: "none",
                                    borderColor: GAME_COLOR, color: GAME_ACCENT, px: 3,
                                }}
                            >
                                Level Menu
                            </Button>
                            <Button
                                onClick={() => navigate("/child/games")}
                                variant="outlined"
                                sx={{
                                    borderRadius: "30px", fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: "none",
                                    borderColor: "#CBD5E1", color: "#64748B", px: 3,
                                }}
                            >
                                Game Station
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    // ── Render: Playing ───────────────────────────────────────────────────────
    // Responsive cell size: fits within available width on any screen
    const sidebarW = window.innerWidth < 900 ? (window.innerWidth < 600 ? 64 : 72) : 250;
    const padding = window.innerWidth < 600 ? 32 : 48;
    const availableW = Math.min(window.innerWidth - sidebarW - padding, 400);
    const cellSize = Math.max(28, Math.min(52, Math.floor(availableW / (grid.length || 5))));

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
            <ChildSidebar activePage="MORE" />
            <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 3, md: 4 } }}>
                <Box sx={{ display: "flex", justifyContent: { xs: "center", sm: "flex-end" }, mb: 2 }}>
                    <TopBarStats totalXp={stats.totalXp} streak={stats.streak} gems={stats.gems} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
                    <Button onClick={() => setPhase("level-select")} sx={{ color: "#64748B", fontFamily: "'Poppins', sans-serif", textTransform: "none", fontWeight: 600, minWidth: 0, px: 1 }}>
                        ← Levels
                    </Button>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box component="img" src={gameIcon} alt="Word Finder" sx={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: { xs: "1rem", sm: "1.3rem" }, color: "#1A202C" }}>
                            Word Finder — Level {currentLevel}
                        </Typography>
                    </Box>
                    <Chip label={levelDesc} size="small" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, backgroundColor: GAME_COLOR + "18", color: GAME_ACCENT, display: { xs: "none", sm: "flex" } }} />
                    <Box sx={{ ml: "auto", backgroundColor: "rgba(37,175,244,0.1)", borderRadius: "20px", px: { xs: 1.5, sm: 2 }, py: 0.5 }}>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, color: "#25AFF4", fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>
                            +{levelGemsReward} 💎
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 3 }, flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "center", sm: "flex-start" } }}>
                    {/* Grid */}
                    {loadingLevel ? (
                        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                            <CircularProgress sx={{ color: GAME_COLOR }} />
                        </Box>
                    ) : (
                        <Box
                            ref={gridRef}
                            onMouseLeave={handleMouseUp}
                            onMouseUp={handleMouseUp}
                            sx={{
                                backgroundColor: "#fff",
                                borderRadius: "20px",
                                border: "2px solid #E8ECF1",
                                p: 2,
                                display: "inline-block",
                                userSelect: "none",
                                cursor: "crosshair",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                                filter: submitting ? "brightness(0.92)" : "none",
                            }}
                        >
                            {grid.map((row, r) => (
                                <Box key={r} sx={{ display: "flex" }}>
                                    {row.map((letter, c) => {
                                        const found = isCellFound(r, c);
                                        const isSelected = isCellSelected(r, c);
                                        return (
                                            <Box
                                                key={c}
                                                onMouseDown={() => handleCellMouseDown(r, c)}
                                                onMouseEnter={() => handleCellMouseEnter(r, c)}
                                                sx={{
                                                    width: cellSize,
                                                    height: cellSize,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "8px",
                                                    m: "2px",
                                                    cursor: "pointer",
                                                    fontFamily: "'Baloo 2', sans-serif",
                                                    fontWeight: 800,
                                                    fontSize: `${Math.max(13, cellSize * 0.44)}px`,
                                                    transition: "all 0.1s",
                                                    backgroundColor: found
                                                        ? GAME_COLOR
                                                        : isSelected
                                                            ? wrongFlash ? "#FF5144" : "#25AFF4"
                                                            : "#F8FAFF",
                                                    color: found || isSelected ? "#fff" : "#1A202C",
                                                    border: `2px solid ${found ? GAME_ACCENT : isSelected ? "#1d96d4" : "#E2E8F0"}`,
                                                    transform: isSelected ? "scale(1.08)" : "scale(1)",
                                                }}
                                            >
                                                {letter}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Word list */}
                    <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 180 }, width: { xs: "100%", sm: "auto" } }}>
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#1A202C", mb: 1.5 }}>
                            Find these words:
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "1fr" }, gap: 1 }}>
                            {placements.map((p) => (
                                <Box
                                    key={p.word}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        p: 1.5,
                                        borderRadius: "14px",
                                        backgroundColor: foundWords.has(p.word) ? GAME_COLOR + "18" : "#fff",
                                        border: `2px solid ${foundWords.has(p.word) ? GAME_COLOR : "#E2E8F0"}`,
                                        transition: "all 0.25s",
                                    }}
                                >
                                    <Typography sx={{ fontSize: "1.2rem" }}>
                                        {foundWords.has(p.word) ? "✅" : "🔍"}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: "'Baloo 2', sans-serif",
                                            fontWeight: 800,
                                            fontSize: "1rem",
                                            color: foundWords.has(p.word) ? GAME_ACCENT : "#1A202C",
                                            textDecoration: foundWords.has(p.word) ? "line-through" : "none",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        {p.word}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ mt: 2, p: 1.5, borderRadius: "12px", backgroundColor: "rgba(37,175,244,0.06)", border: "1.5px solid rgba(37,175,244,0.2)" }}>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem", color: "#0369A1" }}>
                                <strong>{foundWords.size}</strong> / {placements.length} words found
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
