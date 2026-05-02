import { useEffect, useState, useCallback } from "react";
import { Box, Typography, Button, CircularProgress, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChildSidebar from "../../components/ChildSidebar";
import TopBarStats from "../../components/TopBarStats";
import { getLevelData, submitScore, getGames } from "../../services/gamesApi";
import { getDashboardData } from "../../services/quizApi";
import gameIcon from "../../../../assets/wordbulder.png";

const GAME_ID = "word-builder";
const GAME_COLOR = "#A855F7";
const GAME_ACCENT = "#7E22CE";
const TOTAL_LEVELS = 5;
const WORDS_PER_ROUND = 5;

type GamePhase = "level-select" | "playing" | "result" | "level-complete" | "game-complete";

interface TileMeta {
    id: string;
    letter: string;
    used: boolean;
}

interface WordResult {
    word: string;
    correct: boolean;
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

function scramble(word: string): TileMeta[] {
    const letters = word.split("").map((l, i) => ({ id: `${l}-${i}-${Math.random()}`, letter: l, used: false }));
    return shuffle(letters);
}

export default function WordBuilderGame() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalXp: 0, streak: 0, gems: 0 });
    const [phase, setPhase] = useState<GamePhase>("level-select");
    const [currentLevel, setCurrentLevel] = useState(1);
    const [completedLevels, setCompletedLevels] = useState<number[]>([]);
    const [highestLevel, setHighestLevel] = useState(0);
    const [gemsEarned, setGemsEarned] = useState(0);
    const [loadingLevel, setLoadingLevel] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [levelDesc, setLevelDesc] = useState("");
    const [levelGemsReward, setLevelGemsReward] = useState(5);

    // Round/word state
    const [roundWords, setRoundWords] = useState<string[]>([]);
    const [wordIndex, setWordIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState("");
    const [tiles, setTiles] = useState<TileMeta[]>([]);
    const [answer, setAnswer] = useState<TileMeta[]>([]);
    const [checkState, setCheckState] = useState<"idle" | "correct" | "wrong">("idle");
    const [results, setResults] = useState<WordResult[]>([]);

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

    const initWord = (word: string) => {
        setCurrentWord(word);
        setTiles(scramble(word));
        setAnswer([]);
        setCheckState("idle");
    };

    const loadLevel = useCallback(async (level: number) => {
        setLoadingLevel(true);
        setCurrentLevel(level);
        try {
            const data = await getLevelData(GAME_ID, level);
            setLevelDesc(data.description);
            setLevelGemsReward(data.gemsReward);
            const picked = shuffle(data.words).slice(0, WORDS_PER_ROUND);
            setRoundWords(picked);
            setWordIndex(0);
            setResults([]);
            initWord(picked[0]);
            setPhase("playing");
        } catch (err) {
            console.error("Failed to load level:", err);
        } finally {
            setLoadingLevel(false);
        }
    }, []);

    const handleTileClick = (tile: TileMeta) => {
        if (tile.used || checkState !== "idle") return;
        setTiles((prev) => prev.map((t) => t.id === tile.id ? { ...t, used: true } : t));
        setAnswer((prev) => [...prev, tile]);
    };

    const handleAnswerTileClick = (tile: TileMeta) => {
        if (checkState !== "idle") return;
        setAnswer((prev) => prev.filter((t) => t.id !== tile.id));
        setTiles((prev) => prev.map((t) => t.id === tile.id ? { ...t, used: false } : t));
    };

    const handleCheck = () => {
        const built = answer.map((t) => t.letter).join("");
        const isCorrect = built === currentWord;
        setCheckState(isCorrect ? "correct" : "wrong");

        const newResults = [...results, { word: currentWord, correct: isCorrect }];

        setTimeout(() => {
            const nextIdx = wordIndex + 1;
            if (nextIdx < roundWords.length) {
                setResults(newResults);
                setWordIndex(nextIdx);
                initWord(roundWords[nextIdx]);
            } else {
                setResults(newResults);
                const passed = newResults.filter((r) => r.correct).length >= Math.ceil(WORDS_PER_ROUND * 0.6);
                if (passed) {
                    finishLevel(newResults);
                } else {
                    setPhase("result");
                }
            }
        }, isCorrect ? 1000 : 1500);
    };

    const handleClear = () => {
        setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
        setAnswer([]);
        setCheckState("idle");
    };

    const finishLevel = async (finalResults: WordResult[]) => {
        setSubmitting(true);
        try {
            const result = await submitScore(GAME_ID, currentLevel);
            setGemsEarned(result.gemsEarned);
            setStats((s) => ({ ...s, gems: result.newGemBalance }));
            setCompletedLevels(result.completedLevels);
            setHighestLevel(result.highestLevel);
            setResults(finalResults);
            setPhase(currentLevel === TOTAL_LEVELS ? "game-complete" : "level-complete");
        } catch (err) {
            console.error("Submit failed:", err);
            setResults(finalResults);
            setPhase("level-complete");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Level Select ──────────────────────────────────────────────────────────
    if (phase === "level-select") {
        return (
            <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
                <ChildSidebar activePage="MORE" />
                <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 } }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                        <TopBarStats totalXp={stats.totalXp} streak={stats.streak} gems={stats.gems} />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                        <Button onClick={() => navigate("/child/games")} sx={{ color: "#64748B", fontFamily: "'Poppins', sans-serif", textTransform: "none", fontWeight: 600 }}>← Back</Button>
                    </Box>
                    <Box sx={{ backgroundColor: "#fff", borderRadius: "24px", border: "2px solid #E8ECF1", p: { xs: 2.5, sm: 4 }, mb: 4, textAlign: "center" }}>
                        <Box component="img" src={gameIcon} alt="Word Builder" sx={{ width: { xs: 80, sm: 100 }, height: { xs: 80, sm: 100 }, objectFit: "contain", mb: 1 }} />
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: { xs: "1.8rem", sm: "2.4rem" }, color: "#1A202C" }}>Word Builder</Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", color: "#64748B", mt: 0.5 }}>
                            Tap the scrambled letters in the right order to build the word!
                        </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#1A202C", mb: 2 }}>Choose a Level</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((lvl) => {
                            const isCompleted = completedLevels.includes(lvl);
                            const isNext = lvl === highestLevel + 1 || (highestLevel === 0 && lvl === 1);
                            const isLocked = lvl > highestLevel + 1 && highestLevel > 0;
                            return (
                                <Box key={lvl} onClick={() => !isLocked && loadLevel(lvl)}
                                    sx={{
                                        backgroundColor: isCompleted ? GAME_COLOR : isNext ? "#fff" : "#F8FAFF",
                                        border: `2px solid ${isCompleted ? GAME_ACCENT : isNext ? GAME_COLOR : "#E2E8F0"}`,
                                        borderRadius: "20px", p: 2.5, textAlign: "center",
                                        cursor: isLocked ? "not-allowed" : "pointer", opacity: isLocked ? 0.5 : 1, transition: "all 0.2s",
                                        "&:hover": !isLocked ? { transform: "translateY(-3px)", boxShadow: `0 8px 20px ${GAME_COLOR}30` } : {},
                                    }}>
                                    <Typography sx={{ fontSize: "2rem", mb: 0.5 }}>{isCompleted ? "⭐" : isLocked ? "🔒" : "🏗️"}</Typography>
                                    <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: isCompleted ? "#fff" : "#1A202C" }}>Level {lvl}</Typography>
                                    {isCompleted && <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.7rem", color: "#fff", fontWeight: 600 }}>Completed!</Typography>}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        );
    }

    // ── Level/Game Complete / Result ──────────────────────────────────────────
    if (phase === "result" || phase === "level-complete" || phase === "game-complete") {
        const correctCount = results.filter((r) => r.correct).length;
        const passed = correctCount >= Math.ceil(WORDS_PER_ROUND * 0.6);

        return (
            <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
                <ChildSidebar activePage="MORE" />
                <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 }, display: "flex", justifyContent: "center" }}>
                    <Box sx={{ backgroundColor: "#fff", borderRadius: "28px", border: "2px solid #E8ECF1", p: { xs: 3, sm: 5 }, maxWidth: 480, width: "100%", mt: 4 }}>
                        <Typography sx={{ fontSize: "3.5rem", textAlign: "center", mb: 1 }}>{phase === "game-complete" ? "🏆" : passed ? "🎉" : "😅"}</Typography>
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "#1A202C", textAlign: "center", mb: 0.5 }}>
                            {phase === "game-complete" ? "All Levels Done!" : passed ? "Level Complete!" : "Almost! Try Again"}
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#64748B", textAlign: "center", mb: 3 }}>
                            {correctCount} / {results.length} words built correctly
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                            {results.map((r, i) => (
                                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, borderRadius: "12px", backgroundColor: r.correct ? "#F5F3FF" : "#FFF5F5", border: `1.5px solid ${r.correct ? GAME_COLOR : "#FECACA"}` }}>
                                    <Typography sx={{ fontSize: "1.2rem" }}>{r.correct ? "✅" : "❌"}</Typography>
                                    <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: r.correct ? GAME_ACCENT : "#DC2626" }}>
                                        {r.word}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {passed && gemsEarned > 0 && (
                            <Box sx={{ backgroundColor: "rgba(37,175,244,0.08)", border: "2px solid rgba(37,175,244,0.25)", borderRadius: "16px", p: 2, mb: 3, textAlign: "center" }}>
                                <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#25AFF4" }}>💎 +{gemsEarned} Gems!</Typography>
                            </Box>
                        )}

                        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                            {!passed && <Button onClick={() => loadLevel(currentLevel)} variant="contained" sx={{ borderRadius: "30px", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, textTransform: "none", fontSize: "1rem", background: `linear-gradient(135deg, ${GAME_COLOR}, ${GAME_ACCENT})`, px: 3 }}>Try Again</Button>}
                            {passed && phase !== "game-complete" && <Button onClick={() => loadLevel(currentLevel + 1)} variant="contained" sx={{ borderRadius: "30px", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, textTransform: "none", fontSize: "1rem", background: `linear-gradient(135deg, ${GAME_COLOR}, ${GAME_ACCENT})`, px: 3 }}>Next Level →</Button>}
                            <Button onClick={() => setPhase("level-select")} variant="outlined" sx={{ borderRadius: "30px", fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: "none", borderColor: GAME_COLOR, color: GAME_ACCENT, px: 3 }}>Level Menu</Button>
                            <Button onClick={() => navigate("/child/games")} variant="outlined" sx={{ borderRadius: "30px", fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: "none", borderColor: "#CBD5E1", color: "#64748B", px: 3 }}>Game Station</Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    // ── Playing ───────────────────────────────────────────────────────────────
    const builtWord = answer.map((t) => t.letter).join("");
    const isComplete = answer.length === currentWord.length;
    const progressPct = (wordIndex / roundWords.length) * 100;
    // Responsive tile sizes
    const sidebarW = window.innerWidth < 900 ? (window.innerWidth < 600 ? 64 : 72) : 250;
    const cardW = Math.min(500, window.innerWidth - sidebarW - 48);
    const tileW = Math.min(52, Math.max(34, Math.floor((cardW - 40 - (currentWord.length - 1) * 8) / currentWord.length)));

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
            <ChildSidebar activePage="MORE" />
            <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                    <TopBarStats totalXp={stats.totalXp} streak={stats.streak} gems={stats.gems} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                    <Button onClick={() => setPhase("level-select")} sx={{ color: "#64748B", fontFamily: "'Poppins', sans-serif", textTransform: "none", fontWeight: 600 }}>← Levels</Button>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box component="img" src={gameIcon} alt="Word Builder" sx={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#1A202C" }}>Word Builder — Level {currentLevel}</Typography>
                    </Box>
                    <Chip label={levelDesc} size="small" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, backgroundColor: GAME_COLOR + "18", color: GAME_ACCENT }} />
                    <Box sx={{ ml: "auto" }}>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#64748B" }}>Word {wordIndex + 1} / {roundWords.length}</Typography>
                    </Box>
                </Box>

                {/* Progress */}
                <Box sx={{ mb: 3, backgroundColor: GAME_COLOR + "20", borderRadius: "8px", height: 8, overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${GAME_COLOR}, ${GAME_ACCENT})`, borderRadius: "8px", transition: "width 0.4s ease" }} />
                </Box>

                {loadingLevel ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: GAME_COLOR }} /></Box>
                ) : (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Box sx={{ backgroundColor: "#fff", borderRadius: "28px", border: "2px solid #E8ECF1", p: { xs: 2.5, sm: 4 }, maxWidth: 540, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#94A3B8", mb: 1.5, fontWeight: 600 }}>
                                🏗️ Build the word — tap letters in the right order!
                            </Typography>

                            {/* Answer slots */}
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 1.5, flexWrap: "wrap", minHeight: tileW + 8 }}>
                                {Array.from({ length: currentWord.length }, (_, i) => {
                                    const tile = answer[i];
                                    const state = checkState;
                                    return (
                                        <Box key={i}
                                            onClick={() => tile && handleAnswerTileClick(tile)}
                                            sx={{
                                                width: tileW,
                                                height: Math.round(tileW * 1.15),
                                                borderRadius: "12px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                border: `3px solid ${state === "correct" ? "#22C55E" : state === "wrong" ? "#EF4444" : tile ? GAME_COLOR : "#CBD5E1"}`,
                                                backgroundColor: state === "correct" ? "#F5F3FF" : state === "wrong" ? "#FFF5F5" : tile ? GAME_COLOR + "15" : "#F8FAFF",
                                                cursor: tile ? "pointer" : "default",
                                                transition: "all 0.15s",
                                                "&:hover": tile ? { backgroundColor: GAME_COLOR + "25" } : {},
                                            }}>
                                            {tile && (
                                                <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: `${Math.max(14, tileW * 0.52)}px`, color: state === "correct" ? "#15803D" : state === "wrong" ? "#DC2626" : GAME_ACCENT }}>
                                                    {tile.letter}
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>

                            {/* Feedback text */}
                            {checkState === "correct" && (
                                <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#22C55E", mb: 1 }}>
                                    🎉 Correct! Well done!
                                </Typography>
                            )}
                            {checkState === "wrong" && (
                                <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#EF4444", mb: 1 }}>
                                    ❌ Not quite — the word was <strong>{currentWord}</strong>
                                </Typography>
                            )}

                            {/* Scrambled tiles */}
                            <Box sx={{ mt: 2.5, mb: 3 }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.78rem", color: "#94A3B8", mb: 1.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                                    Scrambled Letters
                                </Typography>
                                <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 1, sm: 1.5 }, flexWrap: "wrap" }}>
                                    {tiles.map((tile) => (
                                        <Box key={tile.id}
                                            onClick={() => handleTileClick(tile)}
                                            sx={{
                                                width: tileW, height: Math.round(tileW * 1.08), borderRadius: "14px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                backgroundColor: tile.used ? "#F1F5F9" : GAME_COLOR,
                                                border: `3px solid ${tile.used ? "#E2E8F0" : GAME_ACCENT}`,
                                                cursor: tile.used ? "not-allowed" : "pointer",
                                                opacity: tile.used ? 0.4 : 1,
                                                transition: "all 0.15s",
                                                boxShadow: tile.used ? "none" : `0 4px 10px ${GAME_COLOR}40`,
                                                "&:hover": !tile.used ? { transform: "translateY(-3px)", boxShadow: `0 8px 16px ${GAME_COLOR}50` } : {},
                                            }}>
                                            <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: `${Math.max(14, tileW * 0.52)}px`, color: tile.used ? "#94A3B8" : "#fff" }}>
                                                {tile.letter}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* Action buttons */}
                            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                                <Button onClick={handleClear} variant="outlined" disabled={checkState !== "idle" || answer.length === 0}
                                    sx={{ borderRadius: "30px", fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: "none", borderColor: "#CBD5E1", color: "#64748B", px: 3 }}>
                                    Clear
                                </Button>
                                <Button onClick={handleCheck} variant="contained" disabled={!isComplete || checkState !== "idle" || submitting}
                                    sx={{ borderRadius: "30px", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, textTransform: "none", fontSize: "1.05rem", px: 4, background: `linear-gradient(135deg, ${GAME_COLOR}, ${GAME_ACCENT})`, boxShadow: `0 4px 14px ${GAME_COLOR}40` }}>
                                    {submitting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Check ✓"}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
