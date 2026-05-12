import { useState, useEffect } from "react";
import { Box, Typography, Button, Chip, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import questImg from "../../../assets/quests.png";
import xpsImg from "../../../assets/xps.png";
import gemsImg from "../../../assets/gems.png";
import { getDailyQuestToday, type DailyQuestTodayStatus } from "../services/childDailyQuestApi";

export default function DailyQuestCard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DailyQuestTodayStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyQuestToday()
      .then(setStatus)
      .catch(() => setStatus({ status: "available" }))
      .finally(() => setLoading(false));
  }, []);

  const isCompleted = status?.status === "completed";

  return (
    <Box
      sx={{
        background: isCompleted
          ? "linear-gradient(135deg, #d4edda 0%, #b8dfc4 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "20px",
        p: 2.5,
        mt: 2,
        boxShadow: isCompleted
          ? "0 6px 18px rgba(40,167,69,0.18)"
          : "0 8px 24px rgba(102,126,234,0.30)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box
          component="img"
          src={questImg}
          alt="Quest"
          sx={{ width: 30, height: 30, objectFit: "contain" }}
        />
        <Typography
          sx={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.05rem",
            color: isCompleted ? "#155724" : "#fff",
            flex: 1,
          }}
        >
          Daily Challenge
        </Typography>
        {isCompleted && (
          <Chip
            label="Done ✓"
            size="small"
            sx={{
              backgroundColor: "#28a745",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.68rem",
              height: 22,
            }}
          />
        )}
      </Box>

      {/* ── Sub-title ── */}
      <Typography
        sx={{
          fontSize: "0.83rem",
          color: isCompleted ? "#1a5c2a" : "rgba(255,255,255,0.88)",
          fontWeight: 600,
          mb: 1.5,
        }}
      >
        Answer 10 mixed questions
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <CircularProgress size={22} sx={{ color: "rgba(255,255,255,0.7)" }} />
        </Box>
      ) : isCompleted ? (
        /* ── Completed state ── */
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "1.1rem",
            color: "#155724",
          }}
        >
          Completed for today 🎉
        </Typography>
      ) : (
        /* ── Available state ── */
        <>
          {/* Reward preview */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box component="img" src={xpsImg} alt="XP" sx={{ width: 16, height: 16 }} />
              <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
                Up to 20 XP
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box component="img" src={gemsImg} alt="Gems" sx={{ width: 16, height: 16 }} />
              <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
                Up to 150 gems
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate("/child/daily-quest")}
            sx={{
              backgroundColor: "#fff",
              color: "#764ba2",
              fontWeight: 800,
              fontSize: "0.88rem",
              borderRadius: "12px",
              py: 1,
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              "&:hover": {
                backgroundColor: "#f3ecff",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              },
            }}
          >
            Start Challenge →
          </Button>
        </>
      )}
    </Box>
  );
}
