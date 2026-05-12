import { useEffect, useState } from "react";
import { Box, Typography, Button, Chip, CircularProgress, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChildSidebar from "../components/ChildSidebar";
import TopBarStats from "../components/TopBarStats";
import {
  getDailyQuestToday,
  type DailyQuestTodayStatus,
} from "../services/childDailyQuestApi";
import { getDashboardData } from "../services/quizApi";

import questImg from "../../../assets/quests.png";
import xpsImg   from "../../../assets/xps.png";
import gemsImg  from "../../../assets/gems.png";
import kipImg   from "../../../assets/kip.png";
import starImg  from "../../../assets/star.png";


export default function QuestsPage() {
  const navigate = useNavigate();

  const [questStatus, setQuestStatus]   = useState<DailyQuestTodayStatus | null>(null);
  const [stats, setStats]               = useState({ totalXp: 0, streak: 0, gems: 0 });
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([getDailyQuestToday(), getDashboardData()])
      .then(([qStatus, dashData]) => {
        setQuestStatus(qStatus);
        if (dashData?.stats) setStats(dashData.stats);
      })
      .catch(() => setQuestStatus({ status: "available" }))
      .finally(() => setLoading(false));
  }, []);

  const isCompleted = questStatus?.status === "completed";
  const completion  = questStatus?.completion;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", alignItems: "flex-start" }}>
      <ChildSidebar activePage="QUESTS" />

      <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 4 } }}>

        {/* ── Top bar ── */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <TopBarStats totalXp={stats.totalXp} streak={stats.streak} gems={stats.gems} />
        </Box>

        {/* ── Page header ── */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: { xs: "1.8rem", sm: "2.2rem" },
              color: "#1A202C",
              lineHeight: 1.2,
            }}
          >
            My Quests ⭐
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.95rem",
              color: "#64748B",
              mt: 0.5,
            }}
          >
            Complete daily challenges to earn bonus XP and Gems — without affecting your category levels.
          </Typography>
        </Box>

        {/* ── DAILY QUEST CARD (full) ── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#667eea" }} />
          </Box>
        ) : (
          <Box
            sx={{
              background: isCompleted
                ? "linear-gradient(135deg, #d4edda 0%, #b8dfc4 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "24px",
              p: { xs: 3, sm: 4 },
              mb: 4,
              boxShadow: isCompleted
                ? "0 8px 24px rgba(40,167,69,0.18)"
                : "0 12px 32px rgba(102,126,234,0.30)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative blobs */}
            {!isCompleted && (
              <>
                <Box sx={{
                  position: "absolute", top: -30, right: -30,
                  width: 140, height: 140,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  pointerEvents: "none",
                }} />
                <Box sx={{
                  position: "absolute", bottom: -20, left: "40%",
                  width: 100, height: 100,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  pointerEvents: "none",
                }} />
              </>
            )}

            {/* ── Header row ── */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
              <Box
                component="img"
                src={questImg}
                alt="Quest"
                sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, objectFit: "contain", flexShrink: 0 }}
              />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Typography
                    sx={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 800,
                      fontSize: { xs: "1.3rem", sm: "1.6rem" },
                      color: isCompleted ? "#155724" : "#fff",
                      lineHeight: 1.2,
                    }}
                  >
                    Daily Challenge
                  </Typography>
                  <Chip
                    label={isCompleted ? "Completed ✓" : "Available"}
                    size="small"
                    sx={{
                      backgroundColor: isCompleted ? "#28a745" : "rgba(255,255,255,0.25)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      height: 24,
                      border: isCompleted ? "none" : "1px solid rgba(255,255,255,0.5)",
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.8rem",
                    color: isCompleted ? "#2d6e3f" : "rgba(255,255,255,0.75)",
                    fontWeight: 600,
                    mt: 0.3,
                  }}
                >
                  🔁 Resets every day at midnight
                </Typography>
              </Box>

              {/* Kip character on the right (desktop) */}
              <Box
                component="img"
                src={kipImg}
                alt="Kip"
                sx={{
                  display: { xs: "none", sm: "block" },
                  width: 72,
                  height: 72,
                  objectFit: "contain",
                  flexShrink: 0,
                  filter: isCompleted ? "none" : "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
                  opacity: isCompleted ? 0.7 : 1,
                }}
              />
            </Box>

            {/* ── Description ── */}
            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.95rem",
                color: isCompleted ? "#1a5c2a" : "rgba(255,255,255,0.92)",
                fontWeight: 600,
                mb: 2.5,
                maxWidth: 560,
              }}
            >
              Answer 10 mixed age-appropriate questions across different categories and difficulty levels. The more you get right, the bigger your reward!
            </Typography>

            {isCompleted && completion ? (
              /* ── Completed view ── */
              <>
                <Box
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.55)",
                    borderRadius: "16px",
                    p: 2.5,
                    mb: 2.5,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 3,
                    alignItems: { xs: "flex-start", sm: "center" },
                  }}
                >
                  <Box sx={{ textAlign: "center", flex: 1 }}>
                    <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#155724", lineHeight: 1 }}>
                      {completion.score}%
                    </Typography>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.75rem", color: "#2d6e3f", fontWeight: 700 }}>
                      Your Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={completion.score}
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 8,
                        backgroundColor: "rgba(0,0,0,0.08)",
                        "& .MuiLinearProgress-bar": {
                          background: "linear-gradient(90deg, #28a745, #20c997)",
                          borderRadius: 8,
                        },
                      }}
                    />
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.72rem", color: "#2d6e3f", fontWeight: 600, mt: 0.5 }}>
                      {completion.correctCount}/10 correct
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 3, flex: 2, justifyContent: { xs: "flex-start", sm: "center" } }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                        <Box component="img" src={xpsImg} alt="XP" sx={{ width: 24, height: 24 }} />
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#155724" }}>
                          +{completion.xpEarned}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.72rem", color: "#2d6e3f", fontWeight: 700 }}>
                        XP Earned
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                        <Box component="img" src={gemsImg} alt="Gems" sx={{ width: 24, height: 24 }} />
                        <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#155724" }}>
                          +{completion.gemsEarned}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.72rem", color: "#2d6e3f", fontWeight: 700 }}>
                        Gems Earned
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Typography
                  sx={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    color: "#155724",
                    mb: 0.5,
                  }}
                >
                  🎉 Completed for today!
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.85rem", color: "#2d6e3f", fontWeight: 600 }}>
                  Come back tomorrow to take on the next challenge.
                </Typography>
              </>
            ) : (
              /* ── Available view ── */
              <>
                {/* Reward preview pills */}
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 3 }}>
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: 0.8,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderRadius: "30px", px: 1.8, py: 0.6,
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}>
                    <Box component="img" src={starImg} alt="XP" sx={{ width: 18, height: 18 }} />
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#fff" }}>
                      Earn up to 20 XP
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: 0.8,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderRadius: "30px", px: 1.8, py: 0.6,
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}>
                    <Box component="img" src={gemsImg} alt="Gems" sx={{ width: 18, height: 18 }} />
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#fff" }}>
                      Earn up to 150 Gems
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: 0.8,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderRadius: "30px", px: 1.8, py: 0.6,
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#fff" }}>
                      10 questions
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/child/daily-quest")}
                  sx={{
                    backgroundColor: "#fff",
                    color: "#764ba2",
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    borderRadius: "14px",
                    px: 4,
                    py: 1.3,
                    textTransform: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    "&:hover": {
                      backgroundColor: "#f3ecff",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  Start Challenge →
                </Button>
              </>
            )}
          </Box>
        )}

        {/* ── Tomorrow's Quest ── */}
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: "20px",
            border: "2px dashed #CBD5E0",
            p: { xs: 3, sm: 4 },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 3,
          }}
        >
          {/* Lock icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "18px",
              backgroundColor: "#EDF2F7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              flexShrink: 0,
            }}
          >
            🌅
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
              <Typography
                sx={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.15rem",
                  color: "#94A3B8",
                }}
              >
                Tomorrow's Challenge
              </Typography>
              <Chip
                label="Locked"
                size="small"
                sx={{
                  backgroundColor: "#EDF2F7",
                  color: "#94A3B8",
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  height: 22,
                }}
              />
            </Box>
            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.88rem",
                color: "#94A3B8",
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              A fresh set of 10 mixed questions will be waiting for you tomorrow. Come back to keep the streak going and earn more XP and Gems!
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
