import { Box, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import ChildSidebar from "../components/ChildSidebar";
import TopBarStats from "../components/TopBarStats";
import { getDashboardData } from "../services/quizApi";
import api from "../../../services/apiClient";
import goldImg from "../../../assets/gold.png";
import silverImg from "../../../assets/silver.png";
import bronzeImg from "../../../assets/bronze.png";
import xpsImg from "../../../assets/xps.png";
import gemsImg from "../../../assets/gems.png";
import streakImg from "../../../assets/streak.png";

// ── Types ──────────────────────────────────────────────────────────────────
interface LeaderboardEntry {
    rank: number;
    _id: string;
    name: string;
    avatar: string;
    age: number;
    totalXP: number;
    gems: number;
    streak: number;
    totalLessons: number;
    isCurrentChild: boolean;
}

interface LeaderboardData {
    scope: string;
    minLessons: number;
    lessonsCompleted: number;
    unlocked: boolean;
    currentChildRank: LeaderboardEntry | null;
    leaderboard: LeaderboardEntry[];
}

type Scope = "age-group" | "global";

// ── Podium medal images ────────────────────────────────────────────────────
const MEDAL_IMGS = [goldImg, silverImg, bronzeImg];
const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];
const PODIUM_COLORS = [
    { bg: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", border: "#FFD700", shadow: "rgba(255,215,0,0.4)" },
    { bg: "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)", border: "#C0C0C0", shadow: "rgba(192,192,192,0.4)" },
    { bg: "linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)", border: "#CD7F32", shadow: "rgba(205,127,50,0.4)" },
];

// ── Podium Card for top 3 ──────────────────────────────────────────────────
function PodiumCard({ entry, medalIndex }: { entry: LeaderboardEntry; medalIndex: number }) {
    const color = PODIUM_COLORS[medalIndex];
    const isGold = medalIndex === 0;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.8,
                order: medalIndex === 0 ? 1 : medalIndex === 1 ? 0 : 2,
            }}
        >
            {/* Avatar + Medal */}
            <Box sx={{ position: "relative", mb: 0.5 }}>
                <Box
                    sx={{
                        width: isGold ? 76 : 64,
                        height: isGold ? 76 : 64,
                        borderRadius: "50%",
                        background: color.bg,
                        border: `3px solid ${color.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: isGold ? "2.2rem" : "1.8rem",
                        boxShadow: `0 4px 16px ${color.shadow}`,
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.05)" },
                    }}
                >
                    {entry.avatar}
                </Box>
                <Box
                    component="img"
                    src={MEDAL_IMGS[medalIndex]}
                    alt={MEDAL_EMOJIS[medalIndex]}
                    sx={{
                        position: "absolute",
                        bottom: -6,
                        right: -6,
                        width: isGold ? 30 : 26,
                        height: isGold ? 30 : 26,
                        objectFit: "contain",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                    }}
                />
            </Box>

            {/* Name + XP */}
            <Typography
                sx={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 700,
                    fontSize: isGold ? "0.95rem" : "0.85rem",
                    color: entry.isCurrentChild ? "#25AFF4" : "#2D3748",
                    textAlign: "center",
                    maxWidth: 90,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {entry.name}
                {entry.isCurrentChild && " (You)"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 1 }}>
                <Box component="img" src={xpsImg} alt="XP" sx={{ width: 14, height: 14 }} />
                <Typography
                    sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#D4A000" }}
                >
                    {entry.totalXP.toLocaleString()} XP
                </Typography>
            </Box>

            {/* Podium bar */}
            <Box
                sx={{
                    width: isGold ? 90 : 76,
                    height: isGold ? 70 : medalIndex === 1 ? 55 : 40,
                    background: color.bg,
                    borderRadius: "10px 10px 0 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mt: "auto",
                    boxShadow: `inset 0 4px 8px rgba(255,255,255,0.2), 0 -2px 10px ${color.shadow}`,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: isGold ? "1.6rem" : "1.3rem",
                        color: "rgba(255,255,255,0.95)",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    #{entry.rank}
                </Typography>
            </Box>
        </Box>
    );
}

// ── Rank Row for positions 4+ ──────────────────────────────────────────────
function RankRow({ entry }: { entry: LeaderboardEntry }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: { xs: 2, sm: 3 },
                py: 1.8,
                borderRadius: "16px",
                backgroundColor: entry.isCurrentChild ? "rgba(37,175,244,0.08)" : "#fff",
                border: entry.isCurrentChild ? "2px solid #25AFF4" : "2px solid #E8ECF1",
                transition: "all 0.2s ease",
                "&:hover": { transform: "translateX(4px)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" },
            }}
        >
            <Typography
                sx={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800, fontSize: "1.1rem",
                    color: entry.isCurrentChild ? "#25AFF4" : "#94A3B8",
                    width: 36, textAlign: "center", flexShrink: 0,
                }}
            >
                #{entry.rank}
            </Typography>
            <Box
                sx={{
                    width: 42, height: 42, borderRadius: "50%",
                    backgroundColor: entry.isCurrentChild ? "rgba(37,175,244,0.15)" : "#F1F5F9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.5rem", flexShrink: 0,
                }}
            >
                {entry.avatar}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.92rem",
                        color: entry.isCurrentChild ? "#25AFF4" : "#1A202C",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                >
                    {entry.name}{entry.isCurrentChild && " (You)"}
                </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box component="img" src={xpsImg} alt="XP" sx={{ width: 16, height: 16 }} />
                    <Typography sx={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.78rem", color: "#D4A000" }}>
                        {entry.totalXP.toLocaleString()}
                    </Typography>
                </Box>
                <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 0.5 }}>
                    <Box component="img" src={gemsImg} alt="Gems" sx={{ width: 14, height: 14 }} />
                    <Typography sx={{ fontFamily: "'Poppins'", fontWeight: 600, fontSize: "0.72rem", color: "#25AFF4" }}>{entry.gems}</Typography>
                </Box>
                <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 0.5 }}>
                    <Box component="img" src={streakImg} alt="Streak" sx={{ width: 14, height: 14 }} />
                    <Typography sx={{ fontFamily: "'Poppins'", fontWeight: 600, fontSize: "0.72rem", color: "#FF9447" }}>{entry.streak}</Typography>
                </Box>
            </Box>
        </Box>
    );
}

// ── Locked State ───────────────────────────────────────────────────────────
function LockedState({ lessonsCompleted, minLessons }: { lessonsCompleted: number; minLessons: number }) {
    const remaining = minLessons - lessonsCompleted;
    const pct = Math.min((lessonsCompleted / minLessons) * 100, 100);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, py: 8, px: 3, textAlign: "center" }}>
            <Box sx={{ width: 120, height: 120, borderRadius: "50%", backgroundColor: "rgba(226,232,240,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem" }}>
                🔒
            </Box>
            <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#1A202C" }}>
                Leaderboard Locked!
            </Typography>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", color: "#64748B", maxWidth: 380 }}>
                Complete <strong>{remaining} more lesson{remaining !== 1 ? "s" : ""}</strong> to unlock the leaderboard and start competing! 🚀
            </Typography>
            <Box sx={{ width: "100%", maxWidth: 300 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.78rem", color: "#25AFF4" }}>
                        {lessonsCompleted} / {minLessons} lessons
                    </Typography>
                </Box>
                <Box sx={{ width: "100%", height: 10, backgroundColor: "rgba(37,175,244,0.12)", borderRadius: 10, overflow: "hidden" }}>
                    <Box sx={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #25AFF4, #1d96d4)", borderRadius: 10, transition: "width 1s ease" }} />
                </Box>
            </Box>
        </Box>
    );
}

// ── Scope Toggle ───────────────────────────────────────────────────────────
function ScopeToggle({ scope, onChange }: { scope: Scope; onChange: (s: Scope) => void }) {
    const tabs: { key: Scope; label: string; icon: string }[] = [
        { key: "age-group", label: "Leaderboard", icon: "🏆" },
        { key: "global", label: "Global", icon: "🌍" },
    ];

    return (
        <Box
            sx={{
                display: "inline-flex",
                backgroundColor: "#F1F5F9",
                borderRadius: "30px",
                p: 0.5,
                gap: 0.5,
            }}
        >
            {tabs.map((tab) => {
                const active = scope === tab.key;
                return (
                    <Box
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        sx={{
                            px: { xs: 2, sm: 3 },
                            py: 1,
                            borderRadius: "26px",
                            backgroundColor: active ? "#fff" : "transparent",
                            boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                            "&:hover": { backgroundColor: active ? "#fff" : "rgba(255,255,255,0.6)" },
                        }}
                    >
                        <Typography sx={{ fontSize: "0.95rem" }}>{tab.icon}</Typography>
                        <Typography
                            sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: active ? 700 : 500,
                                fontSize: "0.85rem",
                                color: active ? "#1A202C" : "#64748B",
                            }}
                        >
                            {tab.label}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}

// ── Main LeaderboardPage ───────────────────────────────────────────────────
export default function LeaderboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalXp: 0, streak: 0, gems: 0 });
    const [scope, setScope] = useState<Scope>("age-group");

    // Fetch dashboard stats for top bar
    useEffect(() => {
        getDashboardData()
            .then((d) => { if (d?.stats) setStats(d.stats); })
            .catch(() => { });
    }, []);

    // Fetch leaderboard whenever scope changes
    useEffect(() => {
        setLoading(true);
        api.get(`/child/leaderboard?scope=${scope}`)
            .then((res) => setData(res.data))
            .catch((err) => console.error("Leaderboard error:", err))
            .finally(() => setLoading(false));
    }, [scope]);

    if (loading || !data) {
        return (
            <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F8FB", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    const top3 = data.leaderboard.slice(0, 3);
    const rest = data.leaderboard.slice(3);

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", overflow: "hidden" }}>
            <ChildSidebar activePage="LEADERBOARDS" />

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: { xs: 2, sm: 3, md: 4 }, overflowY: "auto", maxWidth: "100%" }}>
                {/* Top Bar */}
                <Box sx={{ display: "flex", justifyContent: { xs: "center", sm: "flex-end" }, mb: 3 }}>
                    <TopBarStats totalXp={stats.totalXp} streak={stats.streak} gems={stats.gems} />
                </Box>

                {/* Page Header + Toggle */}
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2, mb: 4 }}>
                    <Box>
                        <Typography
                            sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: { xs: "1.8rem", sm: "2.2rem" }, color: "#1A202C", lineHeight: 1.2 }}
                        >
                            {scope === "global" ? "Global Leaderboard 🌍" : "Leaderboard 🏆"}
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", color: "#64748B", mt: 0.5 }}>
                            {scope === "global"
                                ? "Top learners across all age groups!"
                                : "See how you rank against learners your age!"}
                        </Typography>
                    </Box>
                    <ScopeToggle scope={scope} onChange={setScope} />
                </Box>

                {/* Content Card */}
                <Box sx={{ backgroundColor: "#fff", borderRadius: "24px", border: "2px solid #E8ECF1", overflow: "hidden" }}>
                    {/* Locked */}
                    {!data.unlocked ? (
                        <LockedState lessonsCompleted={data.lessonsCompleted} minLessons={data.minLessons} />
                    ) : data.leaderboard.length === 0 ? (
                        /* Empty */
                        <Box sx={{ py: 8, textAlign: "center" }}>
                            <Typography sx={{ fontSize: "3rem", mb: 2 }}>🏜️</Typography>
                            <Typography sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#1A202C", mb: 1 }}>
                                No learners yet!
                            </Typography>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#64748B" }}>
                                Be the first to complete {data.minLessons} lessons and claim the top spot!
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Your Rank Banner */}
                            {data.currentChildRank && (
                                <Box
                                    sx={{
                                        background: "linear-gradient(135deg, #25AFF4 0%, #1d96d4 100%)",
                                        px: { xs: 2.5, sm: 4 }, py: 2.5,
                                        display: "flex", alignItems: "center", gap: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 52, height: 52, borderRadius: "50%",
                                            backgroundColor: "rgba(255,255,255,0.2)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "1.8rem", flexShrink: 0,
                                        }}
                                    >
                                        {user?.avatar ?? "🦊"}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                                            Your Rank
                                        </Typography>
                                        <Typography
                                            sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "#fff", lineHeight: 1 }}
                                        >
                                            #{data.currentChildRank.rank}{" "}
                                            {data.currentChildRank.rank <= 3 && MEDAL_EMOJIS[data.currentChildRank.rank - 1]}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "right" }}>
                                        <Typography sx={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>
                                            {data.currentChildRank.totalXP.toLocaleString()} XP
                                        </Typography>
                                        <Typography sx={{ fontFamily: "'Poppins'", fontSize: "0.72rem", color: "rgba(255,255,255,0.7)" }}>
                                            out of {data.leaderboard.length} learners
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* Podium (top 3) */}
                            {top3.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex", justifyContent: "center", alignItems: "flex-end",
                                        gap: { xs: 1.5, sm: 3 }, px: 3, pt: 5, pb: 2,
                                        background: "linear-gradient(180deg, rgba(37,175,244,0.04) 0%, transparent 100%)",
                                    }}
                                >
                                    {top3.map((entry, i) => (
                                        <PodiumCard key={entry._id} entry={entry} medalIndex={i} />
                                    ))}
                                </Box>
                            )}

                            {/* Remaining ranks */}
                            {rest.length > 0 && (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, p: { xs: 2, sm: 3 } }}>
                                    {rest.map((entry) => (
                                        <RankRow key={entry._id} entry={entry} />
                                    ))}
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
