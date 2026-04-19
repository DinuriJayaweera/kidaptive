import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { startQuiz, submitQuiz } from "../services/quizApi";
import type { PlacementQuestion } from "../services/placementTestApi";

import strengthImg from "../../../assets/strength.png";
import xpsImg from "../../../assets/xps.png";
import gemsImg from "../../../assets/gems.png";
import winsImg from "../../../assets/wins.png";
import medalImg from "../../../assets/medal.png";
import crownImg from "../../../assets/crown.png";
import rocketImg from "../../../assets/rocket.png";
import starImg from "../../../assets/star.png";
import bronzeImg from "../../../assets/bronze.png";
import silverImg from "../../../assets/silver.png";
import goldImg from "../../../assets/gold.png";

import "./AdaptiveQuiz.css";
import "./PlacementQuiz.css";

// ── Types ──────────────────────────────────────────────────
interface ChampionBadge {
  current: string;
  next: string;
  winsToNext: number;
}

interface QuizResult {
  score: number;
  passed: boolean;
  levelUp?: boolean;
  newLevel?: string;
  categoryXP?: number;
  xpToNextLevel?: number;
  xpGained: number;
  totalXP: number;
  gemsEarned: number;
  totalGems: number;
  quizzesCompleted?: number;
  correctCount: number;
  totalQuestions: number;
  isChampion?: boolean;
  championWins?: number;
  championBadge?: ChampionBadge;
  newBadge?: boolean;
}

interface CategoryProgressData {
  categoryId: string;
  level: string;
  xp: number;
  xpToNextLevel: number;
  quizzesCompleted: number;
  questionsAttempted: number;
  championWins: number;
  championBadge: ChampionBadge;
}

type QuizPhase = "quiz" | "result";

const LEVEL_LABELS: Record<string, string> = {
  starter: "Starter",
  explorer: "Explorer",
  champion: "Champion",
};

const NEXT_LEVEL: Record<string, string> = {
  starter: "Explorer",
  explorer: "Champion",
};

const LEVEL_EMOJI: Record<string, string> = {
  starter: strengthImg,
  explorer: medalImg,
  champion: crownImg,
};

const BADGE_EMOJI: Record<string, string> = {
  none: strengthImg,
  bronze: bronzeImg,
  silver: silverImg,
  gold: goldImg,
  master: crownImg,
};

const BADGE_LABELS: Record<string, string> = {
  none: "No Badge",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  master: "Master",
};

// ── Main Component ─────────────────────────────────────────
export default function AdaptiveQuizPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetLevel = searchParams.get("targetLevel") || undefined;
  const isReplay = searchParams.get("isReplay") === "true";

  // ── State ──────────────────────────────────────────
  const [phase, setPhase] = useState<QuizPhase>("quiz");
  const [progress, setProgress] = useState<CategoryProgressData | null>(null);
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<{ questionId: string; selectedAnswer: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  const timerRef = useRef<number>(Date.now());

  const isChampion = progress?.level === "champion";


  // ── Start Quiz (same call for all levels) ──────────
  const handleStartQuiz = useCallback(async () => {
    if (!categoryId) return;
    try {
      setLoading(true);
      setError(null);
      setAnswers([]);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsChecked(false);
      setIsCorrect(false);
      setCorrectAnswer("");
      setResult(null);

      const data = await startQuiz(categoryId, targetLevel);
      if (!data.questions || data.questions.length === 0) {
        setError("No questions available for this category and level yet. Please try again later!");
        setLoading(false);
        return;
      }
      setQuestions(data.questions);
      setCorrectAnswersMap(data.correctAnswers);
      if (data.progress) {
        setProgress((prev) => prev ? {
          ...prev,
          level: data.progress.level,
          xp: data.progress.xp,
          xpToNextLevel: data.progress.xpToNextLevel || 50,
          quizzesCompleted: data.progress.quizzesCompleted || 0,
        } : prev);
      }
      timerRef.current = Date.now();
      setPhase("quiz");
      setLoading(false);
    } catch {
      setError("Could not load quiz questions. Please try again.");
      setLoading(false);
    }
  }, [categoryId, targetLevel]);

  useEffect(() => {
    handleStartQuiz();
  }, [handleStartQuiz]);

  // Reset timer on new question
  useEffect(() => {
    timerRef.current = Date.now();
  }, [currentIndex]);

  // ── Quiz Handlers ──────────────────────────────────
  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const quizProgress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleSelect = (option: string) => {
    if (isChecked) return;
    setSelectedAnswer(option);
  };

  const handleCheck = () => {
    if (!selectedAnswer || !question) return;
    const correct = correctAnswersMap[question._id];
    const answeredCorrectly =
      question.type === "input"
        ? (selectedAnswer || "").trim().toLowerCase() === (correct || "").trim().toLowerCase()
        : selectedAnswer === correct;

    setIsChecked(true);
    setIsCorrect(answeredCorrectly);
    setCorrectAnswer(correct || "");

    const timeTaken = Math.round((Date.now() - timerRef.current) / 1000);
    setAnswers((prev) => [...prev, { questionId: question._id, selectedAnswer, timeTaken }]);
  };

  const handleSkip = () => {
    if (!question) return;
    const timeTaken = Math.round((Date.now() - timerRef.current) / 1000);
    const nextAnswers = [...answers, { questionId: question._id, selectedAnswer: "", timeTaken }];
    setAnswers(nextAnswers);
    moveToNext(nextAnswers);
  };

  const handleContinue = () => moveToNext();

  const moveToNext = async (nextAnswers?: { questionId: string; selectedAnswer: string; timeTaken?: number }[]) => {
    setSelectedAnswer(null);
    setIsChecked(false);
    setIsCorrect(false);
    setCorrectAnswer("");

    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((i) => i + 1);
    } else {
      await submitTest(nextAnswers);
    }
  };

  const submitTest = async (overrideAnswers?: { questionId: string; selectedAnswer: string; timeTaken?: number }[]) => {
    if (!categoryId) return;
    try {
      setLoading(true);
      const data = await submitQuiz(categoryId, overrideAnswers ?? answers, targetLevel, isReplay);
      setResult(data);
      setPhase("result");
      setLoading(false);
    } catch {
      setError("Failed to submit answers. Please try again.");
      setLoading(false);
    }
  };

  const handleExit = () => navigate(`/child/category-progress/${categoryId}`, { replace: true });

  const handleNextQuiz = () => handleStartQuiz();

  const handleBackToHub = () => {
    navigate(`/child/category-progress/${categoryId}`);
  };

  // ── LOADING ────────────────────────────────────────
  if (loading) {
    return (
      <div className="aq-loading">
        <div className="aq-loading-spinner" />
        <p className="aq-loading-text">
          Preparing your quiz...
        </p>
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────
  if (error) {
    return (
      <div className="aq-error">
        <div className="aq-error-icon">😕</div>
        <p className="aq-error-text">{error}</p>
        <div className="aq-error-actions">
          <button className="aq-btn-primary" onClick={() => { setError(null); handleStartQuiz(); }}>Try Again</button>
          <button className="aq-btn-secondary" onClick={handleExit}>Back</button>
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ──────────────────────────────────
  if (phase === "result" && result) {
    const getResultEmojiSrc = (passed: boolean, isChamp: boolean, isRep: boolean) => {
      if (isRep) return passed ? rocketImg : strengthImg;
      if (isChamp) return passed ? winsImg : strengthImg;
      return passed ? starImg : strengthImg;
    };

    if (isReplay) {
      return (
        <div className="aq-result">
          <div className="aq-result-card">
            <div className="aq-result-emoji">
              <img src={getResultEmojiSrc(result.passed, false, true)} alt="Result" style={{ width: 80, height: 80, objectFit: "contain" }} />
            </div>
            <h1 className={`aq-result-title ${result.passed ? "pass" : "fail"}`}>
              {result.passed ? "Great Practice!" : "Good Try!"}
            </h1>
            <p className="aq-result-score">
              You got <strong>{result.correctCount}/{result.totalQuestions}</strong> correct — <strong>{result.score}%</strong>
            </p>
            <div className="aq-result-actions">
              <button className={result.passed ? "aq-btn-success" : "aq-btn-primary"} onClick={handleNextQuiz}>
                {result.passed ? "Practice Again →" : "Try Again →"}
              </button>
              <button className="aq-btn-secondary" onClick={handleBackToHub}>Back to Journey</button>
            </div>
          </div>
        </div>
      );
    }

    const resultIsChampion = result.isChampion;
    const xpPercent = (result.xpToNextLevel || 50) > 0
      ? Math.min(((result.categoryXP || 0) / (result.xpToNextLevel || 50)) * 100, 100)
      : 0;
    const isQuizMilestone = !resultIsChampion && (result.quizzesCompleted || 0) > 0 && (result.quizzesCompleted || 0) % 5 === 0;

    return (
      <div className="aq-result">
        <div className={`aq-result-card ${resultIsChampion ? "champion-result" : ""}`}>
          <div className="aq-result-emoji">
            <img src={getResultEmojiSrc(result.passed, resultIsChampion || false, false)} alt="Result" style={{ width: 80, height: 80, objectFit: "contain" }} />
          </div>

          <h1 className={`aq-result-title ${result.passed ? "pass" : "fail"}`}>
            {resultIsChampion
              ? (result.passed ? "Champion Victory!" : "Not This Time!")
              : (result.passed ? "Great Job!" : "Keep Going!")}
          </h1>

          <p className="aq-result-score">
            You got <strong>{result.correctCount}/{result.totalQuestions}</strong> correct — <strong>{result.score}%</strong>
          </p>

          {/* New Badge (champion only) */}
          {resultIsChampion && result.newBadge && result.championBadge && (
            <div className="aq-badge-earned">
              <span className="aq-badge-earned-icon">
                <img src={BADGE_EMOJI[result.championBadge.current] || medalImg} alt="Badge" style={{ width: 40, height: 40 }} />
              </span>
              <p className="aq-badge-earned-text">
                New Badge: {BADGE_LABELS[result.championBadge.current]}!
              </p>
            </div>
          )}

          {/* Level Up (starter/explorer only) */}
          {!resultIsChampion && result.levelUp && (
            <div className="aq-level-up-banner">
              <p className="aq-level-up-text">
                <img src={starImg} alt="Level Up" style={{ width: 16, height: 16, verticalAlign: "middle" }} /> Level Up! → {LEVEL_LABELS[result.newLevel || ""] || result.newLevel} <img src={LEVEL_EMOJI[result.newLevel || ""] || starImg} alt="Level" style={{ width: 16, height: 16, verticalAlign: "middle" }} />
              </p>
              <p className="aq-level-up-sub">
                {result.newLevel === "champion"
                  ? <>You've unlocked Champion Mode! <img src={crownImg} alt="Crown" style={{ width: 14, height: 14, verticalAlign: "middle" }} /></>
                  : "You've unlocked harder questions!"}
              </p>
            </div>
          )}

          {/* Quiz Milestone (starter/explorer only) */}
          {isQuizMilestone && (
            <div className="aq-milestone">
              <img src={gemsImg} alt="Gems" style={{ width: 18, height: 18 }} />
              <span className="aq-milestone-text">{result.quizzesCompleted} Quizzes Completed! +2 Bonus Gems</span>
            </div>
          )}

          {/* Rewards */}
          <div className="aq-rewards">
            <div className={`aq-reward-item ${result.xpGained > 0 ? "highlight" : ""}`}>
              <span className="aq-reward-icon"><img src={xpsImg} alt="XP" style={{ width: 28, height: 28, objectFit: "contain" }} /></span>
              <span className="aq-reward-value">+{result.xpGained}</span>
              <span className="aq-reward-label">XP Earned</span>
            </div>
            <div className={`aq-reward-item ${result.gemsEarned > 0 ? "highlight" : ""}`}>
              <span className="aq-reward-icon"><img src={gemsImg} alt="Gems" style={{ width: 28, height: 28, objectFit: "contain" }} /></span>
              <span className="aq-reward-value">+{result.gemsEarned}</span>
              <span className="aq-reward-label">Gems</span>
            </div>
            <div className="aq-reward-item">
              <span className="aq-reward-icon"><img src={resultIsChampion ? winsImg : xpsImg} alt="Total" style={{ width: 28, height: 28, objectFit: "contain" }} /></span>
              <span className="aq-reward-value">{resultIsChampion ? (result.championWins || 0) : result.totalXP}</span>
              <span className="aq-reward-label">{resultIsChampion ? "Wins" : "Total XP"}</span>
            </div>
          </div>

          {/* Badge Progress (champion only) */}
          {resultIsChampion && result.championBadge && result.championBadge.current !== "master" && (
            <div className="aq-badge-progress">
              <div className="aq-badge-progress-header">
                <span>Badge Progress</span>
                <span>{result.championBadge.winsToNext} wins to {BADGE_LABELS[result.championBadge.next]}</span>
              </div>
              <div className="aq-badge-track">
                {["bronze", "silver", "gold", "master"].map((badge) => {
                  const thresholds: Record<string, number> = { bronze: 5, silver: 15, gold: 30, master: 50 };
                  const reached = (result.championWins || 0) >= thresholds[badge];
                  return (
                    <div key={badge} className={`aq-badge-dot ${reached ? "reached" : ""}`}>
                      <span style={{ filter: reached ? "none" : "grayscale(100%) opacity(0.5)" }}>
                        <img src={BADGE_EMOJI[badge]} alt={badge} style={{ width: 24, height: 24 }} />
                      </span>
                      <span className="aq-badge-dot-label">{thresholds[badge]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* XP Progress Bar (starter/explorer only, not on level up) */}
          {!resultIsChampion && !result.levelUp && (
            <div className="aq-result-progress">
              <div className="aq-result-progress-header">
                <span className="aq-result-progress-label">
                  {LEVEL_LABELS[result.newLevel || ""] || result.newLevel} Progress
                </span>
                <span className="aq-result-progress-value">
                  {result.categoryXP}/{result.xpToNextLevel} XP
                </span>
              </div>
              <div className="aq-result-bar-track">
                <div className="aq-result-bar-fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <div className="aq-next-level">
                <span>→</span>
                <span>Next: {NEXT_LEVEL[result.newLevel || ""] || "Champion"}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="aq-result-actions">
            <button className={resultIsChampion ? "aq-btn-champion" : (result.passed ? "aq-btn-success" : "aq-btn-primary")} onClick={handleNextQuiz}>
              {resultIsChampion ? <><img src={winsImg} alt="Wins" style={{ width: 14, height: 14, verticalAlign: "middle", marginRight: 6 }} /> Play Again</> : (result.passed ? "Next Quiz →" : "Try Again →")}
            </button>
            <button className="aq-btn-secondary" onClick={handleBackToHub}>Back to Hub</button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ FLOW ──────────────────────────────────────
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
            <button className="pq-exit" onClick={handleExit} aria-label="Exit">×</button>
            <div className="pq-progress-track">
              <div
                className="pq-progress-fill"
                style={{
                  width: `${quizProgress}%`,
                  ...(isChampion ? { background: "linear-gradient(90deg, #f59e0b, #ef4444)" } : {}),
                }}
              />
            </div>
            <span className="aq-counter">
              {isChampion && <img src={crownImg} alt="Crown" style={{ width: 14, height: 14, verticalAlign: "middle", marginRight: 4 }} />}{currentIndex + 1}/{totalQuestions}
            </span>
          </div>

          <div className="pq-content">
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
                    if (opt === correctAnswer) optClass += " pq-option--correct";
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
              <span>Amazing!</span>
            </div>
            <button className="pq-continue pq-continue--correct" onClick={handleContinue}>Continue</button>
          </div>
        ) : (
          <div className="pq-footer pq-footer--wrong">
            <div className="pq-result-text">
              <span className="pq-result-icon pq-result-icon--wrong">×</span>
              <div className="pq-result-detail">
                <strong>Correct solution:</strong>
                <span className="pq-correct-answer">{correctAnswer}</span>
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
