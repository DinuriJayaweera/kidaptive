import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import api from "../../../services/apiClient";

import xpsImg from "../../../assets/xps.png";
import gemsImg from "../../../assets/gems.png";
import kipImg from "../../../assets/kip.png";
import kipAImg from "../../../assets/kip_a.png";
import starImg from "../../../assets/star.png";

import "./PlacementQuiz.css";
import "./MistakesPracticePage.css";

// ── Types ──────────────────────────────────────────────────────
interface MistakeQuestion {
    _id: string;
    questionId: string;
    questionText: string;
    type: "mcq" | "fill" | "input" | "boolean";
    category: string;
    difficulty: "easy" | "medium" | "hard";
    options: string[];
}

interface SessionResult {
    fixedCount: number;
    totalCount: number;
    totalXpGained: number;
    gemsEarned: number;
    totalXP: number;
    totalGems: number;
    remainingMistakes?: number;
    results: { mistakeId: string; correct: boolean; xpGained: number; correctAnswer: string }[];
}

type Phase = "loading" | "empty" | "ready" | "quiz" | "result";

// ── Main Component ─────────────────────────────────────────────
export default function MistakesPracticePage() {
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>("loading");
    const [questions, setQuestions] = useState<MistakeQuestion[]>([]);
    const [correctAnswers, setCorrectAnswers] = useState<Record<string, string>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [totalMistakes, setTotalMistakes] = useState(0);
    const [answers, setAnswers] = useState<{ mistakeId: string; selectedAnswer: string }[]>([]);
    const [result, setResult] = useState<SessionResult | null>(null);

    const timerRef = useRef<number>(Date.now());

    // ── Start session ──────────────────────────────────────────
    useEffect(() => {
        startSession();
    }, []);

    const startSession = async () => {
        try {
            setPhase("loading");
            const res = await api.post("/child/mistakes/start");
            const data = res.data;
            if (!data.questions || data.questions.length === 0) {
                setPhase("empty");
                return;
            }
            setQuestions(data.questions);
            setCorrectAnswers(data.correctAnswers);
            setTotalMistakes(data.totalMistakes || 0);
            setCurrentIndex(0);
            setAnswers([]);
            setSelectedAnswer(null);
            setIsChecked(false);
            setIsCorrect(false);
            setResult(null);
            timerRef.current = Date.now();
            setPhase("ready");
        } catch {
            setPhase("empty");
        }
    };

    // Enter key: Check or Continue (only during quiz phase)
    useEffect(() => {
        if (phase !== "quiz") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Enter") return;
            if (!isChecked) {
                if (selectedAnswer) handleCheck();
            } else {
                handleContinue();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase, isChecked, selectedAnswer]);

    // ── Quiz Handlers ──────────────────────────────────────────
    const question = questions[currentIndex];
    const totalQuestions = questions.length;
    const quizProgress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

    const handleSelect = (opt: string) => {
        if (isChecked) return;
        setSelectedAnswer(opt);
    };

    const handleCheck = () => {
        if (!selectedAnswer || !question) return;
        const correct = correctAnswers[question._id];
        const answeredCorrectly =
            question.type === "input"
                ? (selectedAnswer || "").trim().toLowerCase() === (correct || "").trim().toLowerCase()
                : selectedAnswer === correct;

        setIsChecked(true);
        setIsCorrect(answeredCorrectly);
    };

    const handleSkip = () => {
        if (!question) return;
        const nextAnswers = [...answers, { mistakeId: question._id, selectedAnswer: "" }];
        setAnswers(nextAnswers);
        moveToNext(nextAnswers);
    };

    const handleContinue = () => {
        const nextAnswers = [...answers, { mistakeId: question._id, selectedAnswer: selectedAnswer || "" }];
        setAnswers(nextAnswers);
        moveToNext(nextAnswers);
    };

    const moveToNext = (currentAnswers: { mistakeId: string; selectedAnswer: string }[]) => {
        setSelectedAnswer(null);
        setIsChecked(false);
        setIsCorrect(false);
        timerRef.current = Date.now();

        if (currentIndex + 1 < totalQuestions) {
            setCurrentIndex((i) => i + 1);
        } else {
            submitSession(currentAnswers);
        }
    };

    const submitSession = async (finalAnswers: { mistakeId: string; selectedAnswer: string }[]) => {
        try {
            setPhase("loading");
            const res = await api.post("/child/mistakes/submit", { answers: finalAnswers });
            setResult(res.data);
            setPhase("result");
        } catch {
            setPhase("result");
        }
    };

    // ── LOADING ────────────────────────────────────────────────
    if (phase === "loading") {
        return (
            <div className="pq-page">
                <div className="pq-card mp-loading-container">
                    <div className="mp-loading-content">
                        <div className="aq-loading-spinner" />
                        <p className="mp-loading-text">
                            Finding your mistakes...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── EMPTY ──────────────────────────────────────────────────
    if (phase === "empty") {
        return (
            <div className="pq-page">
                <div className="pq-card mp-empty-container">
                    <img src={kipAImg} alt="Kip celebrating" className="mp-kip-img" />
                    <h1 className="mp-title">
                        Great job! 🎉
                    </h1>
                    <p className="mp-subtitle">
                        No mistakes to practice right now! Keep learning and come back later if you need extra practice.
                    </p>
                    <button
                        onClick={() => navigate("/child/practice")}
                        className="mp-btn-primary"
                    >
                        Back to Practice
                    </button>
                </div>
            </div>
        );
    }

    // ── READY ──────────────────────────────────────────────────
    if (phase === "ready") {
        return (
            <div className="pq-page">
                <div className="pq-card mp-empty-container">
                    <img src={kipImg} alt="Kip ready" className="mp-kip-img" />
                    <h1 className="mp-title">
                        Time to Fix! 🔧
                    </h1>
                    <p className="mp-subtitle mp-subtitle-mb24">
                        You have <strong className="mp-text-danger">{totalMistakes}</strong> unresolved mistake{totalMistakes !== 1 ? 's' : ''} in your pool.
                        Let's fix {Math.min(5, totalMistakes)} of them right now!
                    </p>
                    <div className="mp-actions-container">
                        <button
                            onClick={() => setPhase("quiz")}
                            className="mp-btn-primary-no-mt"
                        >
                            Start Fixing!
                        </button>
                        <button
                            onClick={() => navigate("/child/practice")}
                            className="mp-btn-secondary"
                        >
                            Back to Practice
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    // ── RESULT SCREEN ──────────────────────────────────────────
    if (phase === "result" && result) {
        const allFixed = result.fixedCount === result.totalCount;
        return (
            <div className="pq-page">
                <div className="pq-card mp-result-container">
                    <img
                        src={allFixed ? kipAImg : kipImg}
                        alt="Kip"
                        className="mp-kip-img-sm"
                    />
                    <h1 className="mp-title">
                        {allFixed ? "Amazing! All Fixed! 🎉" : "Good Effort! 👍"}
                    </h1>
                    <p className="mp-subtitle-mb24">
                        You fixed <strong className="mp-text-success">{result.fixedCount}</strong> out of <strong>{result.totalCount}</strong> mistakes!
                        {result.remainingMistakes !== undefined && (
                            <span className="mp-remaining-text">
                                You have <strong>{result.remainingMistakes}</strong> mistake{result.remainingMistakes !== 1 ? 's' : ''} left to fix.
                            </span>
                        )}
                    </p>

                    {/* Rewards */}
                    <div className="mp-rewards-container">
                        <div className="mp-reward-item">
                            <img src={xpsImg} alt="XP" className="mp-reward-icon" />
                            <span className="mp-reward-value-xp">
                                +{result.totalXpGained}
                            </span>
                            <span className="mp-reward-label">XP Earned</span>
                        </div>
                        {result.gemsEarned > 0 && (
                            <div className="mp-reward-item">
                                <img src={gemsImg} alt="Gems" className="mp-reward-icon" />
                                <span className="mp-reward-value-gems">
                                    +{result.gemsEarned}
                                </span>
                                <span className="mp-reward-label">Gems</span>
                            </div>
                        )}
                        <div className="mp-reward-item">
                            <img src={starImg} alt="Total" className="mp-reward-icon" />
                            <span className="mp-reward-value-total">
                                {result.totalXP}
                            </span>
                            <span className="mp-reward-label">Total XP</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mp-actions-container">
                        <button
                            onClick={startSession}
                            className="mp-btn-primary-no-mt"
                        >
                            Practice More Mistakes
                        </button>
                        <button
                            onClick={() => navigate("/child/practice")}
                            className="mp-btn-secondary"
                        >
                            Back to Practice
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── QUIZ FLOW ──────────────────────────────────────────────
    if (phase === "quiz" && question) {
        const parts = question.questionText.split("____");
        const hasFillBlank = parts.length > 1;

        let titleText = "";
        if (question.type === "mcq") titleText = "Choose the correct answer";
        else if (question.type === "fill") titleText = "Fill in the blank";
        else if (question.type === "input") titleText = "Type the missing word";
        else if (question.type === "boolean") titleText = "True or False?";

        return (
            <div className="pq-page">
                <div className="pq-card">
                    <div className="pq-header">
                        <button className="pq-exit" onClick={() => navigate("/child/practice")} aria-label="Exit"><CloseRoundedIcon sx={{ fontSize: 22 }} /></button>
                        <div className="pq-progress-track">
                            <Box
                                className="pq-progress-fill"
                                sx={{
                                    width: `${quizProgress}%`,
                                    background: "linear-gradient(90deg, #FF9447, #FF5144)",
                                }}
                            />
                        </div>
                        <span className="aq-counter">
                            🔧 {currentIndex + 1}/{totalQuestions}
                        </span>
                    </div>

                    <div className="pq-content">
                        {/* Difficulty badge */}
                        <div className="mp-badge-container">
                            <span className={`mp-badge ${question.difficulty === "hard" ? "mp-badge-hard" : question.difficulty === "medium" ? "mp-badge-medium" : "mp-badge-easy"}`}>
                                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                            </span>
                            <span className="mp-badge-label">
                                Fixing a mistake
                            </span>
                        </div>

                        <h2 className="pq-type">{titleText}</h2>

                        {(hasFillBlank && (question.type === "fill" || question.type === "input")) ? (
                            <p className="pq-sentence">
                                {parts[0]}
                                {question.type === "input" ? (
                                    <input
                                        className={`pq-input ${isChecked ? (isCorrect ? "pq-input--correct" : "pq-input--wrong") : ""}`}
                                        value={selectedAnswer || ""}
                                        onChange={(e) => { if (!isChecked) setSelectedAnswer(e.target.value); }}
                                        disabled={isChecked}
                                        placeholder="?"
                                        autoFocus
                                    />
                                ) : (
                                    <span className={`pq-blank ${selectedAnswer ? "pq-blank--filled" : ""} ${isChecked ? (isCorrect ? "pq-blank--correct" : "pq-blank--wrong") : ""}`}>
                                        {selectedAnswer || "______"}
                                    </span>
                                )}
                                {parts.length > 1 && parts[1]}
                            </p>
                        ) : (
                            <p className="pq-sentence">{question.questionText}</p>
                        )}

                        {question.type !== "input" && (
                            <div className="pq-options">
                                {(question.options || []).map((opt, i) => {
                                    if (!opt.trim()) return null;
                                    let optClass = "pq-option";
                                    if (selectedAnswer === opt) optClass += " pq-option--selected";
                                    if (isChecked) {
                                        if (opt === correctAnswers[question._id]) optClass += " pq-option--correct";
                                        else if (selectedAnswer === opt && !isCorrect) optClass += " pq-option--wrong";
                                        else optClass += " pq-option--dimmed";
                                    }
                                    return (
                                        <button key={i} className={optClass} onClick={() => handleSelect(opt)} disabled={isChecked}>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {!isChecked ? (
                    <div className="pq-footer">
                        <button className="pq-skip" onClick={handleSkip}>Skip</button>
                        <button className={`pq-check ${selectedAnswer ? "pq-check--active" : ""}`} onClick={handleCheck} disabled={!selectedAnswer}>Check</button>
                    </div>
                ) : isCorrect ? (
                    <div className="pq-footer pq-footer--correct">
                        <div className="pq-result-text">
                            <span className="pq-result-icon pq-result-icon--correct">✓</span>
                            <span>You fixed it! 🌟</span>
                        </div>
                        <button className="pq-continue pq-continue--correct" onClick={handleContinue}>Continue</button>
                    </div>
                ) : (
                    <div className="pq-footer pq-footer--wrong">
                        <div className="pq-result-text">
                            <span className="pq-result-icon pq-result-icon--wrong">×</span>
                            <div className="pq-result-detail">
                                <strong>Correct answer:</strong>
                                <span className="pq-correct-answer">{correctAnswers[question._id]}</span>
                            </div>
                        </div>
                        <button className="pq-continue pq-continue--wrong" onClick={handleContinue}>Continue</button>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
