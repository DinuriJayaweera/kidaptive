import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  placementTestApi,
  type PlacementQuestion,
  type PlacementAnswer,
} from "../services/placementTestApi";
import "./PlacementQuiz.css";

export default function PlacementQuizPage() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number>(Date.now());

  // ── Load questions ────────────────────────────────────
  const loadTest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAnswers([]);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsChecked(false);
      setIsCorrect(false);
      setCorrectAnswer("");

      const statusRes = await placementTestApi.getStatus();
      if (statusRes.data.placementCompleted) {
        navigate("/child/dashboard", { replace: true });
        return;
      }

      const { data } = await placementTestApi.generate();
      
      if ((data as any).allCompleted) {
        navigate("/child/placement/results", { replace: true });
        return;
      }
      
      setQuestions(data.questions);
      setCorrectAnswersMap(data.correctAnswers);
      timerRef.current = Date.now();
      setLoading(false);
    } catch (err: any) {
      if (err.response?.data?.allCompleted) {
        navigate("/child/placement/results", { replace: true });
        return;
      }
      setError("Could not load questions. Please try again.");
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  // Reset timer when moving to a new question
  useEffect(() => {
    timerRef.current = Date.now();
  }, [currentIndex]);

  // Enter key: Check or Continue
  useEffect(() => {
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
  }, [isChecked, selectedAnswer]);

  // ── Current question ──────────────────────────────────
  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // ── Handle answer selection ───────────────────────────
  const handleSelect = (option: string) => {
    if (isChecked) return;
    setSelectedAnswer(option);
  };

  // ── Handle Check ──────────────────────────────────────
  const handleCheck = () => {
    if (!selectedAnswer || !question) return;

    const timeTaken = Math.round((Date.now() - timerRef.current) / 1000);
    const correct = correctAnswersMap[question._id];
    const answeredCorrectly = selectedAnswer === correct;

    setIsChecked(true);
    setIsCorrect(answeredCorrectly);
    setCorrectAnswer(correct || "");

    // Store the answer
    const answer: PlacementAnswer = {
      questionId: question._id,
      categoryId: question.category,
      difficulty: question.difficulty,
      selectedAnswer,
      timeTaken,
    };

    setAnswers((prev) => [...prev, answer]);
  };

  // ── Handle Skip ───────────────────────────────────────
  const handleSkip = () => {
    if (!question) return;

    const timeTaken = Math.round((Date.now() - timerRef.current) / 1000);

    const answer: PlacementAnswer = {
      questionId: question._id,
      categoryId: question.category,
      difficulty: question.difficulty,
      selectedAnswer: "",
      timeTaken,
    };

    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    moveToNext(nextAnswers);
  };

  // ── Handle Continue (after check) ─────────────────────
  const handleContinue = () => {
    moveToNext();
  };

  // ── Move to next question or finish ───────────────────
  const moveToNext = async (nextAnswers?: PlacementAnswer[]) => {
    setSelectedAnswer(null);
    setIsChecked(false);
    setIsCorrect(false);
    setCorrectAnswer("");

    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Submit all answers
      await submitTest(nextAnswers);
    }
  };

  // ── Submit test ───────────────────────────────────────
  const submitTest = async (overrideAnswers?: PlacementAnswer[]) => {
    try {
      setLoading(true);
      const answersToSubmit = overrideAnswers ?? answers;
      const { data } = await placementTestApi.submit(answersToSubmit);

      if (data.allCompleted) {
        // All categories evaluated → show final results
        navigate("/child/placement/results", { replace: true });
      } else {
        // More categories remain → load next test
        await loadTest();
      }
    } catch {
      setError("Failed to submit answers. Please try again.");
      setLoading(false);
    }
  };

  // ── Handle exit (restart next time) ───────────────────
  const handleExit = async () => {
    try {
      await placementTestApi.reset();
    } catch {
      // Ignore reset errors
    }
    navigate("/child/intro", { replace: true });
  };

  // ── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pq-loading">
        <div className="pq-loading-spinner" />
        <p>Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pq-error">
        <p>{error}</p>
        <button onClick={loadTest}>Try Again</button>
      </div>
    );
  }

  if (!question) return null;

  // Split by the standard "____" marker if it exists
  const parts = question.questionText.split("____");
  const hasFillBlank = parts.length > 1;

  // Determine title based on type
  let titleText = "";
  if (question.type === "mcq") titleText = "Choose the correct answer";
  else if (question.type === "fill") titleText = "Fill in the blank";
  else if (question.type === "input") titleText = "Type the missing word";
  else if (question.type === "boolean") titleText = "True or False?";

  return (
    <div className="pq-page">
      {/* ── Main card ──────────────────────────────────── */}
      <div className="pq-card">
        {/* Progress bar */}
        <div className="pq-header">
          <button className="pq-exit" onClick={handleExit} aria-label="Exit">
            <CloseRoundedIcon sx={{ fontSize: 22 }} />
          </button>
          <div className="pq-progress-track">
            <Box className="pq-progress-fill" sx={{ width: `${progress}%` }} />
          </div>
          <span className="pq-counter">
            {currentIndex + 1}/{totalQuestions}
          </span>
        </div>

        {/* Question content */}
        <div className="pq-content">
          <h2 className="pq-type">{titleText}</h2>

          {/* Sentence / Question Display */}
          {(hasFillBlank && (question.type === "fill" || question.type === "input")) ? (
            <p className="pq-sentence">
              {parts[0]}
              {question.type === "input" ? (
                <input
                  className={`pq-input ${isChecked ? (isCorrect ? "pq-input--correct" : "pq-input--wrong") : ""}`}
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
                    isChecked ? (isCorrect ? "pq-blank--correct" : "pq-blank--wrong") : ""
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

          {/* Answer options (Hidden for Input type) */}
          {question.type !== "input" && (
            <div className="pq-options">
              {(question.options || []).map((opt, i) => {
                // Ignore empty options just in case
                if (!opt.trim()) return null;
                
                let optClass = "pq-option";
                if (selectedAnswer === opt) optClass += " pq-option--selected";
                if (isChecked) {
                  if (opt === correctAnswer) optClass += " pq-option--correct";
                  else if (selectedAnswer === opt && !isCorrect) optClass += " pq-option--wrong";
                  else optClass += " pq-option--dimmed";
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

      {/* ── Footer ─────────────────────────────────────── */}
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
