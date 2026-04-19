import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startQuiz, submitQuiz, getCategoryProgress } from "../services/quizApi";
import type { PlacementQuestion } from "../services/placementTestApi";
import "./AdaptiveQuiz.css";
import "./PlacementQuiz.css";

// ── Types ──────────────────────────────────────────────────
interface QuizResult {
  score: number;
  passed: boolean;
  levelUp: boolean;
  newLevel: string;
  categoryXP: number;
  xpToNextLevel: number;
  xpGained: number;
  totalXP: number;
  gemsEarned: number;
  totalGems: number;
  quizzesCompleted: number;
  correctCount: number;
  totalQuestions: number;
}

interface CategoryProgressData {
  categoryId: string;
  level: string;
  xp: number;
  xpToNextLevel: number;
  quizzesCompleted: number;
  questionsAttempted: number;
}

type QuizPhase = "hub" | "quiz" | "result";

const LEVEL_LABELS: Record<string, string> = {
  starter: "Starter",
  explorer: "Explorer",
  champion: "Champion",
};

const NEXT_LEVEL: Record<string, string> = {
  starter: "Explorer",
  explorer: "Champion",
  champion: "Master",
};

const LEVEL_EMOJI: Record<string, string> = {
  starter: "⭐",
  explorer: "🚀",
  champion: "🏆",
};

// ── Main Component ─────────────────────────────────────────
export default function AdaptiveQuizPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────
  const [phase, setPhase] = useState<QuizPhase>("hub");
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

  // ── Load Category Progress ─────────────────────────
  const loadProgress = useCallback(async () => {
    if (!categoryId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getCategoryProgress(categoryId);
      setProgress(data);
      setLoading(false);
    } catch {
      setError("Could not load category progress.");
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // ── Start Quiz Handler ─────────────────────────────
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

      const data = await startQuiz(categoryId);
      if (!data.questions || data.questions.length === 0) {
        setError("No questions available for this category and level yet. Please try again later!");
        setLoading(false);
        return;
      }
      setQuestions(data.questions);
      setCorrectAnswersMap(data.correctAnswers);
      if (data.progress) {
        setProgress({
          categoryId: categoryId,
          level: data.progress.level,
          xp: data.progress.xp,
          xpToNextLevel: data.progress.xpToNextLevel || 50,
          quizzesCompleted: data.progress.quizzesCompleted || 0,
          questionsAttempted: 0,
        });
      }
      timerRef.current = Date.now();
      setPhase("quiz");
      setLoading(false);
    } catch {
      setError("Could not load quiz questions. Please try again.");
      setLoading(false);
    }
  }, [categoryId]);

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

    const answer = {
      questionId: question._id,
      selectedAnswer,
    };

    setAnswers((prev) => [...prev, answer]);
  };

  const handleSkip = () => {
    if (!question) return;

    const answer = {
      questionId: question._id,
      selectedAnswer: "",
    };

    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    moveToNext(nextAnswers);
  };

  const handleContinue = () => {
    moveToNext();
  };

  const moveToNext = async (nextAnswers?: { questionId: string; selectedAnswer: string }[]) => {
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

  const submitTest = async (overrideAnswers?: { questionId: string; selectedAnswer: string }[]) => {
    if (!categoryId) return;
    try {
      setLoading(true);
      const answersToSubmit = overrideAnswers ?? answers;
      const data = await submitQuiz(categoryId, answersToSubmit);
      setResult(data);
      setPhase("result");
      setLoading(false);
    } catch {
      setError("Failed to submit answers. Please try again.");
      setLoading(false);
    }
  };

  const handleExit = () => {
    navigate("/child/dashboard", { replace: true });
  };

  const handleNextQuiz = () => {
    // Start next quiz immediately
    handleStartQuiz();
  };

  // ── LOADING ────────────────────────────────────────
  if (loading) {
    return (
      <div className="aq-loading">
        <div className="aq-loading-spinner" />
        <p className="aq-loading-text">
          {phase === "hub" ? "Loading your progress..." : "Preparing your quiz..."}
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
          <button className="aq-btn-primary" onClick={() => { setError(null); loadProgress(); }}>
            Try Again
          </button>
          <button className="aq-btn-secondary" onClick={handleExit}>
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ──────────────────────────────────
  if (phase === "result" && result) {
    const xpPercent = result.xpToNextLevel > 0 ? Math.min((result.categoryXP / result.xpToNextLevel) * 100, 100) : 0;
    const isQuizMilestone = result.quizzesCompleted > 0 && result.quizzesCompleted % 5 === 0;

    return (
      <div className="aq-result">
        <div className="aq-result-card">
          {/* Emoji */}
          <div className="aq-result-emoji">
            {result.passed ? "🎉" : "💪"}
          </div>

          {/* Title */}
          <h1 className={`aq-result-title ${result.passed ? "pass" : "fail"}`}>
            {result.passed ? "Great Job!" : "Keep Going!"}
          </h1>

          {/* Score */}
          <p className="aq-result-score">
            You got <strong>{result.correctCount}/{result.totalQuestions}</strong> correct — <strong>{result.score}%</strong>
          </p>

          {/* Level Up */}
          {result.levelUp && (
            <div className="aq-level-up-banner">
              <p className="aq-level-up-text">
                🎉 Level Up! → {LEVEL_LABELS[result.newLevel] || result.newLevel} {LEVEL_EMOJI[result.newLevel] || ""}
              </p>
              <p className="aq-level-up-sub">
                You've unlocked harder questions!
              </p>
            </div>
          )}

          {/* Quiz Milestone */}
          {isQuizMilestone && (
            <div className="aq-milestone">
              <span>💎</span>
              <span className="aq-milestone-text">
                {result.quizzesCompleted} Quizzes Completed! +2 Bonus Gems
              </span>
            </div>
          )}

          {/* Rewards */}
          <div className="aq-rewards">
            <div className={`aq-reward-item ${result.xpGained > 0 ? "highlight" : ""}`}>
              <span className="aq-reward-icon">⚡</span>
              <span className="aq-reward-value">+{result.xpGained}</span>
              <span className="aq-reward-label">XP Earned</span>
            </div>
            <div className={`aq-reward-item ${result.gemsEarned > 0 ? "highlight" : ""}`}>
              <span className="aq-reward-icon">💎</span>
              <span className="aq-reward-value">+{result.gemsEarned}</span>
              <span className="aq-reward-label">Gems</span>
            </div>
            <div className="aq-reward-item">
              <span className="aq-reward-icon">📊</span>
              <span className="aq-reward-value">{result.totalXP}</span>
              <span className="aq-reward-label">Total XP</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          {!result.levelUp && (
            <div className="aq-result-progress">
              <div className="aq-result-progress-header">
                <span className="aq-result-progress-label">
                  {LEVEL_LABELS[result.newLevel] || result.newLevel} Progress
                </span>
                <span className="aq-result-progress-value">
                  {result.categoryXP}/{result.xpToNextLevel} XP
                </span>
              </div>
              <div className="aq-result-bar-track">
                <div
                  className="aq-result-bar-fill"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <div className="aq-next-level">
                <span>→</span>
                <span>Next: {NEXT_LEVEL[result.newLevel] || "Max Level"}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="aq-result-actions">
            {result.passed ? (
              <button className="aq-btn-success" onClick={handleNextQuiz}>
                Next Quiz →
              </button>
            ) : (
              <button className="aq-btn-primary" onClick={handleNextQuiz}>
                Try Again →
              </button>
            )}
            <button className="aq-btn-secondary" onClick={handleExit}>
              Dashboard
            </button>
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
              <div className="pq-progress-fill" style={{ width: `${quizProgress}%` }} />
            </div>
            <span className="pq-counter">{currentIndex + 1}/{totalQuestions}</span>
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

  // ── HUB / CATEGORY PROGRESS SCREEN ─────────────────
  const level = progress?.level || "starter";
  const xp = progress?.xp || 0;
  const xpToNext = progress?.xpToNextLevel || 50;
  const xpPercent = xpToNext > 0 ? Math.min((xp / xpToNext) * 100, 100) : 0;
  const quizzesCompleted = progress?.quizzesCompleted || 0;
  const nextMilestone = Math.ceil((quizzesCompleted + 1) / 5) * 5;

  return (
    <div className="aq-hub">
      {/* Header */}
      <div className="aq-hub-header">
        <button className="aq-hub-back" onClick={handleExit}>
          ← Back
        </button>
        <div className="aq-hub-title-area">
          <h1 className="aq-hub-category-name">
            {categoryId}
          </h1>
          <div className={`aq-hub-level-badge ${level}`}>
            {LEVEL_EMOJI[level] || "⭐"} {LEVEL_LABELS[level] || level}
          </div>
        </div>
        <div style={{ width: 80 }} /> {/* spacer for centering */}
      </div>

      {/* XP Progress */}
      <div className="aq-progress-section">
        <div className="aq-xp-card">
          <div className="aq-xp-header">
            <span className="aq-xp-label">Level Progress</span>
            <span className="aq-xp-value">{xp}/{xpToNext} XP</span>
          </div>
          <div className="aq-xp-bar-track">
            <div
              className={`aq-xp-bar-fill ${level}`}
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <div className="aq-next-level">
            <span>→</span>
            <span>
              {level === "champion"
                ? "You've reached the highest level!"
                : `Next level: ${NEXT_LEVEL[level] || "Explorer"}`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="aq-stats-row">
        <div className="aq-stat-pill">
          <span className="aq-stat-icon">📝</span>
          <div className="aq-stat-info">
            <span className="aq-stat-value">{quizzesCompleted}</span>
            <span className="aq-stat-label">Quizzes</span>
          </div>
        </div>
        <div className="aq-stat-pill">
          <span className="aq-stat-icon">🎯</span>
          <div className="aq-stat-info">
            <span className="aq-stat-value">{progress?.questionsAttempted || 0}</span>
            <span className="aq-stat-label">Attempted</span>
          </div>
        </div>
        <div className="aq-stat-pill">
          <span className="aq-stat-icon">💎</span>
          <div className="aq-stat-info">
            <span className="aq-stat-value">{nextMilestone - quizzesCompleted}</span>
            <span className="aq-stat-label">To Bonus</span>
          </div>
        </div>
      </div>

      {/* Start Quiz */}
      <div className="aq-start-area">
        <button className="aq-start-btn" onClick={handleStartQuiz}>
          🚀 Start Quiz
        </button>
      </div>
    </div>
  );
}
