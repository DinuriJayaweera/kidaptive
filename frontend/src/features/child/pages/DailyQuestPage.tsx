import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import {
  startDailyQuest,
  submitDailyQuest,
  type DailyQuestQuestion,
  type DailyQuestAnswer,
  type DailyQuestSubmitResponse,
} from "../services/childDailyQuestApi";

import xpsImg  from "../../../assets/xps.png";
import gemsImg from "../../../assets/gems.png";
import kipImg  from "../../../assets/kip.png";
import kipAImg from "../../../assets/kip_a.png";
import starImg from "../../../assets/star.png";

import "./AdaptiveQuiz.css";
import "./PlacementQuiz.css";

type Phase = "quiz" | "result";

export default function DailyQuestPage() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────
  const [phase, setPhase]                           = useState<Phase>("quiz");
  const [questions, setQuestions]                   = useState<DailyQuestQuestion[]>([]);
  const [correctAnswersMap, setCorrectAnswersMap]   = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex]             = useState(0);
  const [selectedAnswer, setSelectedAnswer]         = useState<string | null>(null);
  const [isChecked, setIsChecked]                   = useState(false);
  const [isCorrect, setIsCorrect]                   = useState(false);
  const [correctAnswer, setCorrectAnswer]           = useState("");
  const [answers, setAnswers]                       = useState<DailyQuestAnswer[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [submitting, setSubmitting]                 = useState(false);
  const [error, setError]                           = useState<string | null>(null);
  const [result, setResult]                         = useState<DailyQuestSubmitResponse | null>(null);

  const timerRef = useRef<number>(Date.now());

  // ── Load questions ─────────────────────────────────────────
  const loadQuest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsChecked(false);
    setIsCorrect(false);
    setCorrectAnswer("");
    setResult(null);
    setPhase("quiz");

    try {
      const data = await startDailyQuest();
      if (!data.questions || data.questions.length === 0) {
        setError("No daily quest questions available yet. Check back soon!");
        setLoading(false);
        return;
      }
      setQuestions(data.questions);
      setCorrectAnswersMap(data.correctAnswers);
      timerRef.current = Date.now();
      setLoading(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError("You've already completed today's Daily Quest! Come back tomorrow.");
      } else {
        setError("Could not load the Daily Quest. Please try again.");
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuest();
  }, [loadQuest]);

  useEffect(() => {
    timerRef.current = Date.now();
  }, [currentIndex]);

  // ── Quiz helpers ────────────────────────────────────────────
  const question       = questions[currentIndex];
  const totalQuestions = questions.length;
  const quizProgress   = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleSelect = (opt: string) => {
    if (!isChecked) setSelectedAnswer(opt);
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
    setAnswers((prev) => [
      ...prev,
      { questionId: question._id, selectedAnswer, timeTaken },
    ]);
  };

  const handleSkip = () => {
    if (!question) return;
    const timeTaken = Math.round((Date.now() - timerRef.current) / 1000);
    const nextAnswers: DailyQuestAnswer[] = [
      ...answers,
      { questionId: question._id, selectedAnswer: "", timeTaken },
    ];
    setAnswers(nextAnswers);
    moveToNext(nextAnswers);
  };

  const handleContinue = () => moveToNext();

  const moveToNext = async (nextAnswers?: DailyQuestAnswer[]) => {
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

  const submitTest = async (overrideAnswers?: DailyQuestAnswer[]) => {
    try {
      setSubmitting(true);
      const data = await submitDailyQuest(overrideAnswers ?? answers);
      setResult(data);
      setPhase("result");
    } catch (err: any) {
      setError("Failed to submit answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => navigate("/child/dashboard", { replace: true });

  // ── Loading ────────────────────────────────────────────────
  if (loading || submitting) {
    return (
      <div className="aq-loading">
        <div className="aq-loading-spinner" />
        <p className="aq-loading-text">
          {submitting ? "Calculating your results..." : "Preparing Daily Quest..."}
        </p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="aq-error">
        <div className="aq-error-icon">😕</div>
        <p className="aq-error-text">{error}</p>
        <div className="aq-error-actions">
          <button className="aq-btn-secondary" onClick={handleExit}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Result Screen ──────────────────────────────────────────
  if (phase === "result" && result) {
    const passed    = result.passed;
    const xpPercent = Math.min((result.xpEarned / 20) * 100, 100);

    return (
      <div className="aq-result">
        <div className="aq-result-card">
          {/* Kip character */}
          <div className="aq-result-emoji">
            <img
              src={passed ? kipImg : kipAImg}
              alt={passed ? "Kip celebrating" : "Kip encouraging"}
              className="aq-img-80"
            />
          </div>

          <h1 className={`aq-result-title ${passed ? "pass" : "fail"}`}>
            {passed ? "Amazing Quest! 🎉" : "Good Effort! 💪"}
          </h1>

          <p className="aq-result-score">
            You got{" "}
            <strong>
              {result.correctCount}/{result.totalQuestions}
            </strong>{" "}
            correct — <strong>{result.score}%</strong>
          </p>

          {/* Rewards */}
          <div className="aq-rewards">
            <div className={`aq-reward-item ${result.xpEarned > 0 ? "highlight" : ""}`}>
              <span className="aq-reward-icon">
                <img src={xpsImg} alt="XP" className="aq-img-28" />
              </span>
              <span className="aq-reward-value">+{result.xpEarned}</span>
              <span className="aq-reward-label">XP Earned</span>
            </div>
            <div className={`aq-reward-item ${result.gemsEarned > 0 ? "highlight" : ""}`}>
              <span className="aq-reward-icon">
                <img src={gemsImg} alt="Gems" className="aq-img-28" />
              </span>
              <span className="aq-reward-value">+{result.gemsEarned}</span>
              <span className="aq-reward-label">Gems</span>
            </div>
            <div className="aq-reward-item">
              <span className="aq-reward-icon">
                <img src={starImg} alt="Total XP" className="aq-img-28" />
              </span>
              <span className="aq-reward-value">{result.totalXP}</span>
              <span className="aq-reward-label">Total XP</span>
            </div>
          </div>

          {/* XP bar preview */}
          <div className="aq-result-progress">
            <div className="aq-result-progress-header">
              <span className="aq-result-progress-label">Daily Quest XP</span>
              <span className="aq-result-progress-value">+{result.xpEarned} / 20</span>
            </div>
            <div className="aq-result-bar-track">
              <Box
                className="aq-result-bar-fill"
                sx={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Info note */}
          <p
            style={{
              fontSize: "0.75rem",
              color: "#718096",
              textAlign: "center",
              margin: "8px 0 0",
              fontStyle: "italic",
            }}
          >
            Daily Quest rewards do not affect your category levels.
          </p>

          {/* Actions */}
          <div className="aq-result-actions">
            <button className="aq-btn-success" onClick={handleExit}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz Flow ──────────────────────────────────────────────
  if (phase === "quiz" && question) {
    const parts       = question.questionText.split("____");
    const hasFillBlank = parts.length > 1;

    let titleText = "";
    if (question.type === "mcq")     titleText = "Choose the correct answer";
    else if (question.type === "fill")  titleText = "Fill in the blank";
    else if (question.type === "input") titleText = "Type the missing word";
    else if (question.type === "boolean") titleText = "True or False?";

    return (
      <div className="pq-page">
        <div className="pq-card">
          <div className="pq-header">
            <button className="pq-exit" onClick={handleExit} aria-label="Exit">×</button>
            <div className="pq-progress-track">
              <Box
                className="pq-progress-fill"
                sx={{
                  width: `${quizProgress}%`,
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                }}
              />
            </div>
            <span className="aq-counter">
              ⭐ {currentIndex + 1}/{totalQuestions}
            </span>
          </div>

          <div className="pq-content">
            {/* Quest badge */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                backgroundColor: "rgba(102,126,234,0.12)",
                borderRadius: "8px",
                px: 1.2,
                py: 0.4,
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#667eea",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Daily Quest · {question.category} · {question.difficulty}
              </Typography>
            </Box>

            <h2 className="pq-type">{titleText}</h2>

            {hasFillBlank && (question.type === "fill" || question.type === "input") ? (
              <p className="pq-sentence">
                {parts[0]}
                {question.type === "input" ? (
                  <input
                    className={`pq-input ${
                      isChecked ? (isCorrect ? "pq-input--correct" : "pq-input--wrong") : ""
                    }`}
                    value={selectedAnswer || ""}
                    onChange={(e) => {
                      if (!isChecked) setSelectedAnswer(e.target.value);
                    }}
                    disabled={isChecked}
                    placeholder="?"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`pq-blank ${selectedAnswer ? "pq-blank--filled" : ""} ${
                      isChecked
                        ? isCorrect
                          ? "pq-blank--correct"
                          : "pq-blank--wrong"
                        : ""
                    }`}
                  >
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
                    if (opt === correctAnswer)                  optClass += " pq-option--correct";
                    else if (selectedAnswer === opt && !isCorrect) optClass += " pq-option--wrong";
                    else                                        optClass += " pq-option--dimmed";
                  }
                  return (
                    <button
                      key={i}
                      className={optClass}
                      onClick={() => handleSelect(opt)}
                      disabled={isChecked}
                    >
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
            <button className="pq-skip" onClick={handleSkip}>
              Skip
            </button>
            <button
              className={`pq-check ${selectedAnswer ? "pq-check--active" : ""}`}
              onClick={handleCheck}
              disabled={!selectedAnswer}
            >
              Check
            </button>
          </div>
        ) : isCorrect ? (
          <div className="pq-footer pq-footer--correct">
            <div className="pq-result-text">
              <span className="pq-result-icon pq-result-icon--correct">✓</span>
              <span>Amazing!</span>
            </div>
            <button className="pq-continue pq-continue--correct" onClick={handleContinue}>
              Continue
            </button>
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
            <button className="pq-continue pq-continue--wrong" onClick={handleContinue}>
              Continue
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
