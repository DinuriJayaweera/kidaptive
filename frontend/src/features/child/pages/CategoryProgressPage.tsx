import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCategoryProgress } from "../services/quizApi";
import kipMascot from "../../../assets/kip.png"; // Fixed asset path
import LockIcon from "@mui/icons-material/LockRounded";
import strengthImg from "../../../assets/strength.png";
import medalImg from "../../../assets/medal.png";
import crownImg from "../../../assets/crown.png";
import "./CategoryProgress.css";

// ── Types ──────────────────────────────────────────────────
interface CategoryProgressData {
  categoryId: string;
  level: string;
  xp: number;
  xpToNextLevel: number;
  quizzesCompleted: number;
  totalCompletedQuizzes: number;
  questionsAttempted: number;
  championWins: number;
}

type TimelineItem =
  | { type: "trophy"; level: "starter" | "explorer" | "champion"; label: string; locked: boolean; key: string }
  | { type: "node"; index: number; status: "completed" | "current" | "locked"; hasCharacter?: boolean; key: string };

const SPEECH_OPTIONS = ["Great job!", "Keep going!", "Almost there!", "Here we go!"];

export default function CategoryProgressPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<CategoryProgressData | null>(null);

  const currentNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    getCategoryProgress(categoryId)
      .then((data) => {
        setProgress(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load progress path.");
        setLoading(false);
      });
  }, [categoryId]);

  // Scroll to current node when loaded
  useEffect(() => {
    if (!loading && currentNodeRef.current) {
      currentNodeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="cp-page" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="aq-loading-spinner" />
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="cp-page" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button className="cp-back-btn" onClick={() => navigate("/child/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Generate Timeline ──────────────────────────────────
  // Calculate baseline completed quizzes based on level to handle legacy data/placement jumps
  let baseCompleted = 0;
  if (progress.level === "explorer") {
    baseCompleted = 5 + (progress.quizzesCompleted || 0);
  } else if (progress.level === "champion") {
    baseCompleted = 10 + (progress.championWins || 0) + (progress.quizzesCompleted || 0);
  } else {
    baseCompleted = progress.quizzesCompleted || 0;
  }

  const totalCompleted = Math.max(progress.totalCompletedQuizzes || 0, baseCompleted);
  const currentIndex = totalCompleted + 1;
  const items: TimelineItem[] = [];

  let starterEnd = 5;
  let explorerEnd = 10;

  if (progress.level === "starter") {
    starterEnd = Math.max(5, currentIndex + 2);
    explorerEnd = starterEnd + 5;
  } else if (progress.level === "explorer") {
    starterEnd = totalCompleted - (progress.quizzesCompleted || 0);
    explorerEnd = Math.max(starterEnd + 5, currentIndex + 2);
  } else if (progress.level === "champion") {
    const championCount = progress.quizzesCompleted || 0;
    const beforeChampion = totalCompleted - championCount;
    starterEnd = 5;
    explorerEnd = Math.max(5, beforeChampion);
  }

  // Starter
  items.push({ type: "trophy", level: "starter", label: "Starter Level", locked: false, key: "trophy-starter" });
  for (let i = 1; i <= starterEnd; i++) {
    const status = i < currentIndex ? "completed" : i === currentIndex ? "current" : "locked";
    items.push({ type: "node", index: i, status, key: `node-${i}` });
  }

  // Explorer
  const explorerUnlocked = totalCompleted >= starterEnd;
  items.push({ type: "trophy", level: "explorer", label: "Explorer Level", locked: !explorerUnlocked, key: "trophy-explorer" });
  for (let i = starterEnd + 1; i <= explorerEnd; i++) {
    const status = i < currentIndex ? "completed" : i === currentIndex ? "current" : "locked";
    items.push({ type: "node", index: i, status, key: `node-${i}` });
  }

  // Champion
  const championUnlocked = totalCompleted >= explorerEnd;
  items.push({ type: "trophy", level: "champion", label: "Champion Level", locked: !championUnlocked, key: "trophy-champion" });

  const championMax = Math.max(explorerEnd + 5, currentIndex + 3);
  for (let i = explorerEnd + 1; i <= championMax; i++) {
    const status = i < currentIndex ? "completed" : i === currentIndex ? "current" : "locked";
    items.push({ type: "node", index: i, status, key: `node-${i}` });
  }

  // Add character to current node and one completed node visually
  const characterIndex = items.findIndex((i) => i.type === "node" && i.status === "current");
  if (characterIndex >= 0) {
    (items[characterIndex] as any).hasCharacter = true;
  }

  // ── Handlers ──────────────────────────────────────────
  const handleNodeClick = (node: any) => {
    if (node.status === "locked") return;
    
    let targetLevel = "champion";
    if (node.index <= starterEnd) targetLevel = "starter";
    else if (node.index <= explorerEnd) targetLevel = "explorer";

    const isReplay = node.status === "completed";
    navigate(`/child/quiz/${categoryId}?targetLevel=${targetLevel}&isReplay=${isReplay}`);
  };

  return (
    <div className="cp-page">
      <header className="cp-header">
        <button className="cp-back-btn" onClick={() => navigate("/child/dashboard")}>
          ← Back
        </button>
        <h1 className="cp-title">{categoryId} Journey</h1>
        <div style={{ width: 80 }} /> {/* spacer for center alignment */}
      </header>

      <div className="cp-timeline-container">
        <div className="cp-timeline-line" />

        {items.map((item) => {
          if (item.type === "trophy") {
            const TrophyIconSrc = 
              item.level === "starter" ? strengthImg : 
              item.level === "explorer" ? medalImg : crownImg;
            
            return (
              <div key={item.key} className="cp-trophy-wrapper">
                <div className={`cp-trophy ${item.level} ${item.locked ? "locked" : ""}`}>
                  {item.locked ? (
                    <LockIcon sx={{ fontSize: 32, color: "#A0AEC0" }} />
                  ) : (
                    <img src={TrophyIconSrc} alt={item.level} style={{ width: 44, height: 44, objectFit: "contain" }} />
                  )}
                </div>
                <div className="cp-trophy-label">{item.label}</div>
              </div>
            );
          }

          if (item.type === "node") {
            const isLeft = item.index % 2 === 0;
            return (
              <div
                key={item.key}
                className="cp-node-wrapper"
                ref={item.status === "current" ? currentNodeRef : null}
              >
                {/* Character */}
                {item.hasCharacter && (
                  <div className={`cp-character-container ${isLeft ? "left" : "right"}`}>
                    <div className="cp-speech-bubble">
                      {SPEECH_OPTIONS[item.index % SPEECH_OPTIONS.length]}
                    </div>
                    <img src={kipMascot} alt="Kip" className="cp-mascot" />
                  </div>
                )}

                <div
                  className={`cp-node ${item.status}`}
                  onClick={() => handleNodeClick(item)}
                >
                  {item.status === "locked" ? <LockIcon sx={{ fontSize: 28, opacity: 0.7 }} /> : item.index}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
