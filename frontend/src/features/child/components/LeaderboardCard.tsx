import { Box, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/apiClient";
import winsImg from "../../../assets/wins.png";
import goldImg from "../../../assets/gold.png";
import silverImg from "../../../assets/silver.png";
import bronzeImg from "../../../assets/bronze.png";

interface RankEntry {
    rank: number;
    name: string;
    avatar: string;
    totalXP: number;
    isCurrentChild: boolean;
}

interface CardData {
    unlocked: boolean;
    lessonsCompleted: number;
    minLessons: number;
    currentChildRank: RankEntry | null;
    leaderboard: RankEntry[];
}

const MEDAL_IMGS = [goldImg, silverImg, bronzeImg];

export default function LeaderboardCard() {
    const navigate = useNavigate();
    const [data, setData] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/child/leaderboard")
            .then((res) => setData(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box sx={{ backgroundColor: "#F8FAFC", border: "2px solid #E2E8F0", borderRadius: "20px", p: 2.5, mt: 3, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={24} sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    // ── Locked State ────────────────────────────────────────────────────────
    if (!data || !data.unlocked) {
        const completed = data?.lessonsCompleted ?? 0;
        const needed = data?.minLessons ?? 5;
        const remaining = Math.max(needed - completed, 0);

        return (
            <Box
                sx={{
                    backgroundColor: "#F8FAFC",
                    border: "2px solid #E2E8F0",
                    borderRadius: "20px",
                    p: 2.5,
                    mt: 3,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                }}
            >
                <Typography
                    sx={{
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        color: "#1A202C",
                        mb: 2,
                    }}
                >
                    Unlock Leaderboards!
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "14px",
                            backgroundColor: "#E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Box
                            component="img"
                            src={winsImg}
                            alt="Trophy"
                            sx={{ width: 28, height: 28, objectFit: "contain", filter: "grayscale(100%) opacity(0.6)" }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: "#4A5568", fontWeight: 500, lineHeight: 1.4 }}>
                            Complete {remaining} more lesson{remaining !== 1 ? "s" : ""} to start competing
                        </Typography>
                        {/* Mini progress bar */}
                        <Box sx={{ mt: 1, width: "100%", height: 6, backgroundColor: "#E2E8F0", borderRadius: 6, overflow: "hidden" }}>
                            <Box sx={{ width: `${Math.min((completed / needed) * 100, 100)}%`, height: "100%", background: "linear-gradient(90deg, #25AFF4, #1d96d4)", borderRadius: 6, transition: "width 0.5s ease" }} />
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    // ── Active / Unlocked State ─────────────────────────────────────────────
    const top3 = data.leaderboard.slice(0, 3);
    const myRank = data.currentChildRank;

    return (
        <Box
            onClick={() => navigate("/child/leaderboards")}
            sx={{
                backgroundColor: "#fff",
                border: "2px solid #E8ECF1",
                borderRadius: "20px",
                p: 2.5,
                mt: 3,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(37,175,244,0.12)",
                    borderColor: "#25AFF4",
                },
            }}
        >
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Box component="img" src={winsImg} alt="Trophy" sx={{ width: 24, height: 24, objectFit: "contain" }} />
                    <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "#1A202C" }}>
                        Leaderboard
                    </Typography>
                </Box>
                {myRank && (
                    <Box
                        sx={{
                            backgroundColor: myRank.rank <= 3 ? "rgba(255,215,0,0.15)" : "rgba(37,175,244,0.1)",
                            px: 1.5,
                            py: 0.4,
                            borderRadius: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Typography sx={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.78rem", color: myRank.rank <= 3 ? "#D4A000" : "#25AFF4" }}>
                            #{myRank.rank}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Top 3 mini preview */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {top3.map((entry, i) => (
                    <Box
                        key={entry.name + i}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            py: 0.6,
                            px: 1,
                            borderRadius: "12px",
                            backgroundColor: entry.isCurrentChild ? "rgba(37,175,244,0.06)" : "transparent",
                        }}
                    >
                        <Box component="img" src={MEDAL_IMGS[i]} alt={`#${i + 1}`} sx={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} />
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                backgroundColor: "#F1F5F9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.95rem",
                                flexShrink: 0,
                            }}
                        >
                            {entry.avatar}
                        </Box>
                        <Typography
                            sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: entry.isCurrentChild ? 700 : 500,
                                fontSize: "0.82rem",
                                color: entry.isCurrentChild ? "#25AFF4" : "#374151",
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {entry.name}{entry.isCurrentChild ? " (You)" : ""}
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.72rem", color: "#D4A000" }}>
                            {entry.totalXP.toLocaleString()}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* View link */}
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <Typography
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: "#25AFF4",
                    }}
                >
                    View Full Leaderboard →
                </Typography>
            </Box>
        </Box>
    );
}
