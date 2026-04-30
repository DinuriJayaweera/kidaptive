import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, LinearProgress } from "@mui/material";
import ChildSidebar from "../components/ChildSidebar";
import TopBarStats from "../components/TopBarStats";
import { getAchievements, type Achievement, type AchievementCategory } from "../services/achievementsApi";
import { getDashboardData } from "../services/quizApi";

const CATEGORY_META: Record<
    AchievementCategory,
    { label: string; subtitle: string; emoji: string }
> = {
    placement: { label: "Placement", subtitle: "Master each level", emoji: "👑" },
    streak: { label: "Streaks", subtitle: "Keep the fire burning", emoji: "🔥" },
    quiz: { label: "Quizzes", subtitle: "Practice makes perfect", emoji: "⭐" },
    gem: { label: "Gems", subtitle: "Build your treasure", emoji: "💎" },
    accuracy: { label: "Accuracy", subtitle: "Precision pays off", emoji: "🎯" },
    champion_badges: { label: "Champion Badges", subtitle: "Win at the highest level", emoji: "🏅" },
    special: { label: "Special", subtitle: "The big milestones", emoji: "🏆" },
};

const CATEGORY_ORDER: AchievementCategory[] = [
    "placement",
    "streak",
    "quiz",
    "gem",
    "accuracy",
    "champion_badges",
    "special",
];

function AchievementCard({ a }: { a: Achievement }) {
    const pct =
        a.progress.target > 0
            ? Math.min(100, Math.round((a.progress.current / a.progress.target) * 100))
            : 0;
    const showProgress = !a.unlocked && a.progress.target > 1;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 2.5,
                borderRadius: "20px",
                backgroundColor: a.unlocked
                    ? "rgba(255,193,7,0.10)"
                    : "rgba(0,0,0,0.03)",
                border: a.unlocked ? "2px solid #FFD700" : "2px solid #E2E8F0",
                opacity: a.unlocked ? 1 : 0.7,
                transition: "all 0.2s ease",
                minHeight: 200,
                position: "relative",
                "&:hover": a.unlocked
                    ? {
                        transform: "translateY(-3px)",
                        boxShadow: "0 8px 20px rgba(255,193,7,0.3)",
                    }
                    : {},
            }}
        >
            {!a.unlocked && (
                <Box sx={{ position: "absolute", top: 8, right: 8, fontSize: "0.85rem", opacity: 0.6 }}>
                    🔒
                </Box>
            )}
            {a.unlocked && (
                <Box sx={{ position: "absolute", top: 8, right: 8, fontSize: "0.85rem" }}>
                    ✨
                </Box>
            )}
            <Box
                sx={{
                    fontSize: "2.8rem",
                    mb: 1,
                    filter: a.unlocked ? "none" : "grayscale(100%)",
                    transition: "filter 0.2s",
                }}
            >
                {a.icon}
            </Box>
            <Typography
                sx={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: a.unlocked ? "#1A202C" : "#94A3B8",
                    textAlign: "center",
                    lineHeight: 1.2,
                    mb: 0.5,
                }}
            >
                {a.title}
            </Typography>
            <Typography
                sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.75rem",
                    color: a.unlocked ? "#4A5568" : "#94A3B8",
                    textAlign: "center",
                    lineHeight: 1.3,
                    mb: showProgress ? 1.5 : 0,
                    flexGrow: 1,
                }}
            >
                {a.description}
            </Typography>
            {showProgress && (
                <Box sx={{ width: "100%", mt: "auto" }}>
                    <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                            height: 8,
                            borderRadius: 8,
                            backgroundColor: "rgba(0,0,0,0.08)",
                            "& .MuiLinearProgress-bar": {
                                background: "linear-gradient(90deg, #25AFF4, #1d96d4)",
                                borderRadius: 8,
                            },
                        }}
                    />
                    <Typography
                        sx={{
                            mt: 0.5,
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: "#64748B",
                            textAlign: "center",
                        }}
                    >
                        {a.progress.current} / {a.progress.target}
                    </Typography>
                </Box>
            )}
            {a.unlocked && (
                <Typography
                    sx={{
                        mt: "auto",
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#D4A000",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                    }}
                >
                    Earned!
                </Typography>
            )}
        </Box>
    );
}

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [summary, setSummary] = useState({ unlocked: 0, total: 0 });
    const [stats, setStats] = useState({ totalXp: 0, streak: 0, gems: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getAchievements(), getDashboardData()])
            .then(([achData, dashData]) => {
                setAchievements(achData.achievements);
                setSummary(achData.summary);
                if (dashData?.stats) setStats(dashData.stats);
            })
            .catch((err) => console.error("Failed to load achievements:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    backgroundColor: "#F4F8FB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    const grouped: Record<AchievementCategory, Achievement[]> = {
        placement: [],
        streak: [],
        quiz: [],
        gem: [],
        accuracy: [],
        champion_badges: [],
        special: [],
    };
    for (const a of achievements) {
        grouped[a.category].push(a);
    }

    const summaryPct =
        summary.total > 0 ? Math.round((summary.unlocked / summary.total) * 100) : 0;

    /**
     * Layout matches the rest of the child pages: flex container with
     * sidebar as a flex item. The sidebar uses position: sticky +
     * alignSelf: flex-start so it pins to the top of the viewport while
     * the main content scrolls.
     */
    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#F4F8FB",
                display: "flex",
                // alignItems flex-start prevents the flex container from
                // stretching the sidebar to match content height. Combined
                // with sidebar's alignSelf: flex-start, the sticky behavior
                // works cleanly.
                alignItems: "flex-start",
            }}
        >
            <ChildSidebar activePage="ACHIEVEMENTS" />

            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    p: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: { xs: "center", sm: "flex-end" },
                        mb: 3,
                    }}
                >
                    <TopBarStats {...stats} />
                </Box>

                <Box
                    sx={{
                        backgroundColor: "#fff",
                        borderRadius: "24px",
                        border: "2px solid #E8ECF1",
                        p: { xs: 2.5, sm: 3.5 },
                        mb: 4,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 3,
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                fontFamily: "'Baloo 2', sans-serif",
                                fontWeight: 800,
                                fontSize: { xs: "1.7rem", sm: "2.1rem" },
                                color: "#1A202C",
                                lineHeight: 1.2,
                            }}
                        >
                            My Achievements 🏆
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: "0.95rem",
                                color: "#64748B",
                                mt: 0.5,
                            }}
                        >
                            Keep learning to unlock them all!
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                            minWidth: 160,
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: "'Baloo 2', sans-serif",
                                fontWeight: 800,
                                fontSize: "1.6rem",
                                color: "#25AFF4",
                                lineHeight: 1,
                            }}
                        >
                            {summary.unlocked} / {summary.total}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: "0.72rem",
                                color: "#64748B",
                                textTransform: "uppercase",
                                letterSpacing: 0.8,
                                fontWeight: 600,
                            }}
                        >
                            Unlocked
                        </Typography>
                        <Box sx={{ width: "100%", mt: 0.5 }}>
                            <LinearProgress
                                variant="determinate"
                                value={summaryPct}
                                sx={{
                                    height: 8,
                                    borderRadius: 8,
                                    backgroundColor: "rgba(37,175,244,0.12)",
                                    "& .MuiLinearProgress-bar": {
                                        background: "linear-gradient(90deg, #25AFF4, #1d96d4)",
                                        borderRadius: 8,
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </Box>

                {CATEGORY_ORDER.map((cat) => {
                    const items = grouped[cat];
                    if (items.length === 0) return null;
                    const meta = CATEGORY_META[cat];
                    const earnedHere = items.filter((i) => i.unlocked).length;

                    return (
                        <Box key={cat} sx={{ mb: 4 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: 1.5,
                                    mb: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Typography sx={{ fontSize: "1.4rem" }}>{meta.emoji}</Typography>
                                <Typography
                                    sx={{
                                        fontFamily: "'Baloo 2', sans-serif",
                                        fontWeight: 800,
                                        fontSize: { xs: "1.2rem", sm: "1.4rem" },
                                        color: "#1A202C",
                                    }}
                                >
                                    {meta.label}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontSize: "0.85rem",
                                        color: "#94A3B8",
                                        ml: 1,
                                        display: { xs: "none", sm: "block" },
                                    }}
                                >
                                    {meta.subtitle}
                                </Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Typography
                                    sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        color: "#64748B",
                                    }}
                                >
                                    {earnedHere} / {items.length}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "repeat(2, 1fr)",
                                        sm: "repeat(3, 1fr)",
                                        md: "repeat(4, 1fr)",
                                    },
                                    gap: 2,
                                }}
                            >
                                {items.map((a) => (
                                    <AchievementCard key={a.key} a={a} />
                                ))}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}