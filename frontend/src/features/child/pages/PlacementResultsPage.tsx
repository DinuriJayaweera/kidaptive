import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { useAuth } from "../../auth/context/AuthContext";
import { placementTestApi, type CategoryResult } from "../services/placementTestApi";
import kipImg from "../../../assets/kip.png";
import "./PlacementResults.css";

const ENCOURAGEMENT = [
  "You're doing amazing! 🌟",
  "Great job, superstar! ⭐",
  "Wow, you're awesome! 🎉",
  "Keep up the great work! 💪",
  "You're a learning champion! 🏆",
];

const LEVEL_CONFIG: Record<string, {
  stars: number;
  color: string;
  bg: string;
  emoji: string;
  message: string;
  label: string;
}> = {
  starter: {
    stars: 1,
    color: "#FF9447",
    bg: "#fff7ed",
    emoji: "🌱",
    message: "Let's grow together!",
    label: "Starter",
  },
  explorer: {
    stars: 2,
    color: "#FFCC35",
    bg: "#fffbeb",
    emoji: "🔍",
    message: "Great exploring!",
    label: "Explorer",
  },
  champion: {
    stars: 3,
    color: "#8EE870",
    bg: "#ecfdf5",
    emoji: "🏆",
    message: "You're a champion!",
    label: "Champion",
  },
};

export default function PlacementResultsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState<CategoryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await placementTestApi.getResults();
        setResults(data.categoryResults);
        setLoading(false);
        // Stagger the reveal animation
        setTimeout(() => setShowResults(true), 300);
      } catch {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleContinue = () => {
    // Mark placement as done so route guard allows dashboard access
    if (user?._id) {
      localStorage.setItem(`placementDone_${user._id}`, "true");
    }
    navigate("/child/dashboard", { replace: true });
  };

  const encouragement = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];

  if (loading) {
    return (
      <div className="pr-loading">
        <div className="pr-loading-spinner" />
        <p>Calculating your results...</p>
      </div>
    );
  }

  return (
    <div className="pr-page">
      {/* Header */}
      <div className="pr-header">
        <div className="pr-kip">
          <img src={kipImg} alt="Kip" />
        </div>
        <div className="pr-header-text">
          <h1 className="pr-title">Great Job! 🎉</h1>
          <p className="pr-subtitle">{encouragement}</p>
        </div>
      </div>

      {/* Results cards */}
      <div className="pr-results">
        {results.map((r, i) => {
          const config = LEVEL_CONFIG[r.level] || LEVEL_CONFIG.starter;
          return (
            <Box
              key={r.categoryId}
              className={`pr-card ${showResults ? "pr-card--visible" : ""}`}
              sx={{
                animationDelay: `${0.2 + i * 0.12}s`,
                borderLeftColor: config.color,
              }}
            >
              <div className="pr-card-left">
                <Box component="span" className="pr-card-emoji" sx={{ background: config.bg }}>
                  {config.emoji}
                </Box>
                <div className="pr-card-info">
                  <strong className="pr-card-category">{r.categoryId}</strong>
                  <Box component="span" className="pr-card-level" sx={{ color: config.color }}>
                    {config.label}
                  </Box>
                </div>
              </div>
              <div className="pr-card-right">
                <span className="pr-card-score">{r.score}%</span>
                <div className="pr-stars">
                  {[1, 2, 3].map((s) => (
                    <Box
                      component="span"
                      key={s}
                      className={`pr-star ${s <= config.stars ? "pr-star--filled" : ""}`}
                      sx={s <= config.stars ? { color: config.color } : {}}
                    >
                      ★
                    </Box>
                  ))}
                </div>
              </div>
            </Box>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pr-footer">
        <button className="pr-continue" onClick={handleContinue}>
          Continue to Dashboard →
        </button>
      </div>
    </div>
  );
}
