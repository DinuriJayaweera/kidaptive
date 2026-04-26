import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { startQuiz, submitQuiz } from "../services/quizApi";
import type { PlacementQuestion } from "../services/placementTestApi"; // For typing purposes
import "./PlacementQuiz.css";

interface QuizResult {
  score: number;
  passed: boolean;
  levelUp: boolean;
  newLevel: string;
  categoryXP: number;
  xpGained: number;
  totalXP: number;
}

export default function PracticeQuizPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────
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

  // ── Load questions ────────────────────────────────────
  const loadTest = useCallback(async () => {
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

      const data = await startQuiz(categoryId);
      if (!data.questions || data.questions.length === 0) {
        setError("No practice questions found for this category and level.");
        setLoading(false);
        return;
      }
      setQuestions(data.questions);
      setCorrectAnswersMap(data.correctAnswers);
      timerRef.current = Date.now();
      setLoading(false);
    } catch (err: any) {
      setError("Could not load practice questions. Please try again.");
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  // Reset timer when moving to a new question
  useEffect(() => {
    timerRef.current = Date.now();
  }, [currentIndex]);

  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

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
      setLoading(false);
    } catch {
      setError("Failed to submit answers. Please try again.");
      setLoading(false);
    }
  };

  const handleExit = () => {
    navigate("/child/dashboard", { replace: true });
  };

  // ── RESULT SCREEN ─────────────────────────────────────
  if (result) {
    return (
      <div className="pq-page">
        <Box className="pq-card" sx={{ textAlign: "center", padding: "40px 20px" }}>
          <Box component="h1" sx={{ fontFamily: "'Baloo 2', cursive", fontSize: "3rem", color: result.passed ? "#8EE870" : "#FF5144", margin: "0" }}>
            {result.passed ? "Great Job!" : "Keep Trying!"}
          </Box>
          <Box component="p" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.2rem", margin: "20px 0", color: "#64748b" }}>
            You scored {result.score}%
          </Box>
          <Box sx={{ background: "#f0f4f8", borderRadius: "16px", display: "inline-block", padding: "20px 40px", marginBottom: "30px" }}>
             <Box component="p" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.2rem", margin: "0", color: "#111827", fontWeight: 600 }}>
                +{result.xpGained} XP
             </Box>
             <Box component="p" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#64748b", margin: "5px 0 0 0" }}>
                Total XP: {result.totalXP}
             </Box>
          </Box>
          {result.levelUp && (
             <Box sx={{ background: "#fffbe6", color: "#d97706", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold", width: "fit-content", margin: "0 auto 30px auto" }}>
               🎉 Category Level Up: {result.newLevel.toUpperCase()} 🎉
             </Box>
          )}
          <Box sx={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Box component="button" 
                onClick={handleExit}
                sx={{ background: "#25AFF4", color: "#fff", border: "none", borderRadius: "999px", padding: "12px 32px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
                Back to Dashboard
              </Box>
              {result.passed ? null : (
                <Box component="button" 
                  onClick={loadTest}
                  sx={{ background: "#f1f5f9", color: "#1e293b", border: "none", borderRadius: "999px", padding: "12px 32px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
                  Try Again
                </Box>
              )}
          </Box>
        </Box>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pq-loading">
        <div className="pq-loading-spinner" />
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pq-error">
        <p>{error}</p>
        <Box sx={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={loadTest}>Try Again</button>
          <button onClick={handleExit}>Dashboard</button>
        </Box>
      </div>
    );
  }

  if (!question) return null;

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
            <Box className="pq-progress-fill" sx={{ width: `${progress}%` }} />
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
