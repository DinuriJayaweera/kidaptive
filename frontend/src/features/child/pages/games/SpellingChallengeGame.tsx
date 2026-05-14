import { useEffect, useState, useCallback, useRef } from "react";
import { Box, Typography, Button, CircularProgress, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChildSidebar from "../../components/ChildSidebar";
import TopBarStats from "../../components/TopBarStats";
import { getLevelData, submitScore, getGames } from "../../services/gamesApi";
import { getDashboardData } from "../../services/quizApi";
import gameIcon from "../../../../assets/spellingchallenge.png";

const GAME_ID = "spelling-challenge";
const GAME_COLOR = "#F97316";
const GAME_ACCENT = "#C2410C";
const TOTAL_LEVELS = 5;
const WORDS_PER_ROUND = 5;
const SHOW_DURATION_MS = 2500;

type GamePhase = "level-select" | "showing" | "typing" | "checking" | "round-result" | "level-complete" | "game-complete";

interface WordResult {
    word: string;
    typed: string;
    correct: boolean;
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

export default function SpellingChallengeGame() {
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

    // Round state
    const [roundWords, setRoundWords] = useState<string[]>([]);
    const [wordIndex, setWordIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState("");
    const [typed, setTyped] = useState("");
    const [showTimer, setShowTimer] = useState(0);
    const [results, setResults] = useState<WordResult[]>([]);
    const [letterStates, setLetterStates] = useState<("idle" | "correct" | "wrong")[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const clearTimer = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    const startWordShow = useCallback((word: string) => {
        setCurrentWord(word);
        setTyped("");
        setLetterStates(Array(word.length).fill("idle"));
        setShowTimer(SHOW_DURATION_MS / 1000);
        setPhase("showing");

        timerRef.current = setInterval(() => {
            setShowTimer((t) => {
                if (t <= 1) {
                    clearTimer();
                    setPhase("typing");
                    setTimeout(() => inputRef.current?.focus(), 100);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    }, []);

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
            startWordShow(picked[0]);
        } catch (err) {
            console.error("Failed to load level:", err);
        } finally {
            setLoadingLevel(false);
        }
    }, [startWordShow]);

    useEffect(() => () => clearTimer(), []);

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase().slice(0, currentWord.length);
        setTyped(val);

        const states: ("idle" | "correct" | "wrong")[] = currentWord.split("").map((ch, i) => {
            if (i >= val.length) return "idle";
            return val[i] === ch ? "correct" : "wrong";
        });
        setLetterStates(states);
    };

    const handleSubmitWord = () => {
        clearTimer();
        const isCorrect = typed === currentWord;
        const newResults = [...results, { word: currentWord, typed, correct: isCorrect }];
        setResults(newResults);
        setPhase("checking");

        setTimeout(() => {
            const nextIdx = wordIndex + 1;
            if (nextIdx < roundWords.length) {
                setWordIndex(nextIdx);
                startWordShow(roundWords[nextIdx]);
            } else {
                const passed = newResults.filter((r) => r.correct).length >= Math.ceil(WORDS_PER_ROUND * 0.6);
                if (passed) {
                    handleLevelComplete(newResults);
                } else {
                    setPhase("round-result");
                }
            }
        }, 1200);
    };

    const handleLevelComplete = async (finalResults: WordResult[]) => {
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && typed.length === currentWord.length && phase === "typing") {
            handleSubmitWord();
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
                        <Button onClick={() => navigate("/child/games")} sx={{ color: "#64748B", fontFamily: "'Poppins', sans-serif", textTransform: "none", fontWeight: 600 }}>
                            ← Back
                        </Button>
                    </Box>
                    <Box sx={{ backgroundColor: "#fff", borderRadius: "24px", border: "2px solid #E8ECF1", p: { xs: 2.5, sm: 4 }, mb: 4, textAlign: "center" }}>
                        <Box component="img" src={gameIcon} alt="Spelling Challenge" sx={{ width: { xs: 80, sm: 100 }, height: { xs: 80, sm: 100 }, objectFit: "contain", mb: 1 }} />
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: { xs: "1.8rem", sm: "2.4rem" }, color: "#1A202C" }}>
                            Spelling Challenge
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", color: "#64748B", mt: 0.5 }}>
                            Study the word, then spell it from memory — {WORDS_PER_ROUND} words per round!
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
                                    <Typography sx={{ fontSize: "2rem", mb: 0.5 }}>{isCompleted ? "⭐" : isLocked ? "🔒" : "✏️"}</Typography>
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

    // ── Level/Game Complete ───────────────────────────────────────────────────
    if (phase === "level-complete" || phase === "game-complete" || phase === "round-result") {
        const correctCount = results.filter((r) => r.correct).length;
        const passed = correctCount >= Math.ceil(WORDS_PER_ROUND * 0.6);

        return (
            <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
                <ChildSidebar activePage="MORE" />
                <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 }, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                    <Box sx={{ backgroundColor: "#fff", borderRadius: "28px", border: "2px solid #E8ECF1", p: { xs: 3, sm: 5 }, maxWidth: 480, width: "100%", mt: 4 }}>
                        <Typography sx={{ fontSize: "3.5rem", textAlign: "center", mb: 1 }}>
                            {phase === "game-complete" ? "🏆" : passed ? "🎉" : "😅"}
                        </Typography>
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "#1A202C", textAlign: "center", mb: 0.5 }}>
                            {phase === "game-complete" ? "All Levels Done!" : passed ? "Level Complete!" : "Almost! Try Again"}
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#64748B", textAlign: "center", mb: 3 }}>
                            {correctCount} / {results.length} words correct
                        </Typography>

                        {/* Word results */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                            {results.map((r, i) => (
                                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, borderRadius: "12px", backgroundColor: r.correct ? "#F0FDF4" : "#FFF5F5", border: `1.5px solid ${r.correct ? "#22C55E" : "#FECACA"}` }}>
                                    <Typography sx={{ fontSize: "1.2rem" }}>{r.correct ? "✅" : "❌"}</Typography>
                                    <Box>
                                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: r.correct ? "#15803D" : "#DC2626" }}>
                                            {r.word}
                                        </Typography>
                                        {!r.correct && r.typed && (
                                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.72rem", color: "#94A3B8" }}>
                                                You typed: {r.typed}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {passed && gemsEarned > 0 && (
                            <Box sx={{ backgroundColor: "rgba(37,175,244,0.08)", border: "2px solid rgba(37,175,244,0.25)", borderRadius: "16px", p: 2, mb: 3, textAlign: "center" }}>
                                <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#25AFF4" }}>
                                    💎 +{gemsEarned} Gems!
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                            {!passed && (
                                <Button onClick={() => loadLevel(currentLevel)} variant="contained"
                                    sx={{ borderRadius: "30px", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, textTransform: "none", fontSize: "1rem", background: `linear-gradient(135deg, ${GAME_COLOR}, ${GAME_ACCENT})`, px: 3 }}>
                                    Try Again
                                </Button>
                            )}
                            {passed && phase !== "game-complete" && (
                                <Button onClick={() => loadLevel(currentLevel + 1)} variant="contained"
                                    sx={{ borderRadius: "30px", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, textTransform: "none", fontSize: "1rem", background: `linear-gradient(135deg, ${GAME_COLOR}, ${GAME_ACCENT})`, px: 3 }}>
                                    Next Level →
                                </Button>
                            )}
                            <Button onClick={() => setPhase("level-select")} variant="outlined"
                                sx={{ borderRadius: "30px", fontFamily: "'Poppins', sans-serif", fontWeight: 700, textTransform: "none", borderColor: GAME_COLOR, color: GAME_ACCENT, px: 3 }}>
                                Level Menu
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    // ── Playing phases: showing / typing / checking ───────────────────────────
    const progressPct = ((wordIndex) / roundWords.length) * 100;
    // Responsive letter box size — fits within card width on any screen
    const sidebarW = window.innerWidth < 900 ? (window.innerWidth < 600 ? 64 : 72) : 250;
    const cardContentW = Math.min(420, window.innerWidth - sidebarW - 64);
    const letterBoxW = Math.min(52, Math.max(32, Math.floor((cardContentW - currentWord.length * 8) / currentWord.length)));
    const letterBoxH = Math.round(letterBoxW * 1.15);

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
            <ChildSidebar activePage="MORE" />
            <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                    <TopBarStats totalXp={stats.totalXp} streak={stats.streak} gems={stats.gems} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                    <Button onClick={() => { clearTimer(); setPhase("level-select"); }} sx={{ color: "#64748B", fontFamily: "'Poppins', sans-serif", textTransform: "none", fontWeight: 600 }}>
                        ← Levels
                    </Button>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box component="img" src={gameIcon} alt="Spelling Challenge" sx={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: { xs: "1rem", sm: "1.3rem" }, color: "#1A202C" }}>
                            Spelling — Level {currentLevel}
                        </Typography>
                    </Box>
                    <Chip label={levelDesc} size="small" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, backgroundColor: GAME_COLOR + "18", color: GAME_ACCENT, display: { xs: "none", sm: "inline-flex" } }} />
                    <Box sx={{ ml: "auto" }}>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#64748B" }}>
                            Word {wordIndex + 1} / {roundWords.length}
                        </Typography>
                    </Box>
                </Box>

                {/* Round progress */}
                <Box sx={{ mb: 3, backgroundColor: GAME_COLOR + "20", borderRadius: "8px", height: 8, overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${GAME_COLOR}, ${GAME_ACCENT})`, borderRadius: "8px", transition: "width 0.4s ease" }} />
                </Box>

                {loadingLevel ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                        <CircularProgress sx={{ color: GAME_COLOR }} />
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Box sx={{ backgroundColor: "#fff", borderRadius: "28px", border: "2px solid #E8ECF1", p: { xs: 3, sm: 5 }, maxWidth: 500, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

                            {/* Phase: SHOWING */}
                            {(phase === "showing") && (
                                <>
                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#94A3B8", mb: 2, fontWeight: 600 }}>
                                        📖 Remember this word...
                                    </Typography>
                                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 3, flexWrap: "wrap" }}>
                                        {currentWord.split("").map((ch, i) => (
                                            <Box key={i} sx={{ width: letterBoxW, height: letterBoxH, backgroundColor: GAME_COLOR, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${GAME_COLOR}40` }}>
                                                <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: `${Math.max(14, letterBoxW * 0.56)}px`, color: "#fff" }}>
                                                    {ch}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    <Box sx={{ backgroundColor: GAME_COLOR + "15", borderRadius: "20px", px: 3, py: 1, display: "inline-block" }}>
                                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: GAME_COLOR }}>
                                            {showTimer}s
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem", color: "#94A3B8", mt: 1 }}>
                                        Get ready to spell it!
                                    </Typography>
                                </>
                            )}

                            {/* Phase: TYPING */}
                            {(phase === "typing" || phase === "checking") && (
                                <>
                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#94A3B8", mb: 2, fontWeight: 600 }}>
                                        ✏️ Now spell the word!
                                    </Typography>

                                    {/* Letter boxes */}
                                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 3, flexWrap: "wrap" }}>
                                        {currentWord.split("").map((_, i) => {
                                            const state = letterStates[i] ?? "idle";
                                            return (
                                                <Box key={i}
                                                    sx={{
                                                        width: letterBoxW, height: letterBoxH, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
                                                        border: `3px solid ${state === "correct" ? "#22C55E" : state === "wrong" ? "#EF4444" : "#CBD5E1"}`,
                                                        backgroundColor: state === "correct" ? "#F0FDF4" : state === "wrong" ? "#FFF5F5" : "#F8FAFF",
                                                        transition: "all 0.15s",
                                                    }}>
                                                    <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: `${Math.max(14, letterBoxW * 0.56)}px`, color: state === "correct" ? "#15803D" : state === "wrong" ? "#DC2626" : "#CBD5E1" }}>
                                                        {typed[i] ?? ""}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>

                                    {/* Hidden input */}
                                    <input
                                        ref={inputRef}
                                        value={typed}
                                        onChange={handleTyping}
                                        onKeyDown={handleKeyDown}
                                        disabled={phase === "checking"}
                                        style={{ opacity: 0, position: "absolute", width: 1, height: 1 }}
                                    />

                                    <Button
                                        variant="contained"
                                        onClick={handleSubmitWord}
                                        disabled={typed.length < currentWord.length || phase === "checking"}
                                        sx={{
                                            borderRadius: "30px", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, textTransform: "none", fontSize: "1.1rem", px: 5, py: 1.2,
                                            background: `linear-gradient(135deg, ${GAME_COLOR}, ${GAME_ACCENT})`,
                                            boxShadow: `0 4px 14px ${GAME_COLOR}40`,
                                        }}
                                    >
                                        {phase === "checking" ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Check ✓"}
                                    </Button>

                                    <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
                                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ch) => (
                                            <Box key={ch}
                                                onClick={() => { if (phase === "typing" && typed.length < currentWord.length) { const v = typed + ch; setTyped(v); const states: ("idle" | "correct" | "wrong")[] = currentWord.split("").map((c, i) => { if (i >= v.length) return "idle"; return v[i] === c ? "correct" : "wrong"; }); setLetterStates(states); } }}
                                                sx={{
                                                    width: 34, height: 34, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                                                    border: "2px solid #E2E8F0", backgroundColor: "#F8FAFF", cursor: "pointer", transition: "all 0.1s",
                                                    fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.85rem",
                                                    "&:hover": { backgroundColor: GAME_COLOR + "20", borderColor: GAME_COLOR },
                                                }}>
                                                {ch}
                                            </Box>
                                        ))}
                                        <Box onClick={() => { if (phase === "typing") { const v = typed.slice(0, -1); setTyped(v); setLetterStates(currentWord.split("").map((c, i) => { if (i >= v.length) return "idle"; return v[i] === c ? "correct" : "wrong"; })); } }}
                                            sx={{ width: 48, height: 34, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #E2E8F0", backgroundColor: "#FFF5F5", cursor: "pointer", fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#EF4444", "&:hover": { backgroundColor: "#FEE2E2" } }}>
                                            ⌫
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
