import { Box, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import ChildSidebar from "../components/ChildSidebar";
import TopBarStats from "../components/TopBarStats";
import LeaderboardCard from "../components/LeaderboardCard";
import DailyQuestCard from "../components/DailyQuestCard";
import { getDashboardData } from "../services/quizApi";

// Assets
import musicImg from "../../../assets/music.png";
import mistakesImg from "../../../assets/mistakes.png";
import readingImg from "../../../assets/reading-book.png";

// ── Background Decor Component ─────────────────────────────────────────────
function BackgroundDecor() {
    return (
        <Box
            sx={{
                position: "absolute",
                bottom: 0,
                right: -40,
                width: 400,
                height: 400,
                opacity: 0.25, // slightly more visible
                pointerEvents: "none",
                display: { xs: "none", md: "block" },
                zIndex: 0,
            }}
        >
            {/* Music note */}
            <Box
                component="img"
                src={musicImg}
                sx={{ position: "absolute", top: 40, left: 20, width: 90, transform: "rotate(-15deg)", filter: "grayscale(100%) brightness(200%) sepia(100%) hue-rotate(180deg) saturate(200%) opacity(0.8)" }}
            />
            {/* Book */}
            <Box
                component="img"
                src={readingImg}
                sx={{ position: "absolute", bottom: 20, left: 10, width: 130, transform: "rotate(10deg)", filter: "grayscale(100%) brightness(200%) sepia(100%) hue-rotate(180deg) saturate(200%) opacity(0.8)" }}
            />
            {/* Mistakes folder */}
            <Box
                component="img"
                src={mistakesImg}
                sx={{ position: "absolute", bottom: 60, right: 30, width: 110, transform: "rotate(-10deg)", filter: "grayscale(100%) brightness(200%) sepia(100%) hue-rotate(180deg) saturate(200%) opacity(0.8)" }}
            />
            {/* Star decor */}
            <Typography sx={{ position: "absolute", top: 140, right: 80, fontSize: "2rem", color: "#25AFF4", opacity: 0.6 }}>✨</Typography>
            <Typography sx={{ position: "absolute", bottom: 180, left: 140, fontSize: "1.5rem", color: "#25AFF4", opacity: 0.6 }}>✦</Typography>
        </Box>
    );
}

// ── Practice Card Component ───────────────────────────────────────────────
interface PracticeCardProps {
    title: string;
    subtitle: string;
    icon: string;
    bgColor: string;
    onClick: () => void;
}

function PracticeCard({ title, subtitle, icon, bgColor, onClick }: PracticeCardProps) {
    return (
        <Box
            onClick={onClick}
            sx={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#fff",
                border: "2px solid #E8ECF1",
                borderRadius: "16px",
                p: { xs: 2, sm: 3 },
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 24px rgba(37,175,244,0.12)",
                    borderColor: "#25AFF4",
                },
            }}
        >
            <Box sx={{ pr: 2 }}>
                <Typography
                    sx={{
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: "1.25rem",
                        color: "#1A202C",
                        mb: 0.5,
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "0.9rem",
                        color: "#64748B",
                        lineHeight: 1.4,
                    }}
                >
                    {subtitle}
                </Typography>
            </Box>

            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "16px",
                    backgroundColor: bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
            >
                <Box
                    component="img"
                    src={icon}
                    alt={title}
                    sx={{
                        width: 38,
                        height: 38,
                        objectFit: "contain",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                    }}
                />
            </Box>
        </Box>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function PracticePage() {
    useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalXp: 0, streak: 0, gems: 0 });

    useEffect(() => {
        getDashboardData()
            .then((d) => {
                if (d?.stats) setStats(d.stats);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F8FB", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#F4F8FB", display: "flex", overflow: "hidden" }}>
            {/* Sidebar */}
            <Box sx={{ display: { xs: "none", md: "block" } }}>
                <ChildSidebar activePage="PRACTICE" />
            </Box>

            {/* Main Content Area */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    gap: { xs: 3, lg: 4 },
                    p: { xs: 2, sm: 3, md: 4 },
                    overflowY: "auto",
                }}
            >
                {/* Center Column: Practice Cards */}
                <Box sx={{ flex: 1, pt: 1, position: "relative" }}>
                    <Typography
                        sx={{
                            fontFamily: "'Baloo 2', sans-serif",
                            fontWeight: 800,
                            fontSize: "1.4rem",
                            color: "#25AFF4",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            mb: 3,
                        }}
                    >
                        PRACTICE
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, position: "relative", zIndex: 1, maxWidth: 800 }}>
                        <PracticeCard
                            title="Listen Music"
                            subtitle="Time to tune in! Listen closely to magical sounds and music 🎵"
                            icon={musicImg}
                            bgColor="#FFE4E1" // Light pink
                            onClick={() => console.log("Listen clicked")}
                        />

                        <PracticeCard
                            title="Oopsies & Fixes!"
                            subtitle="Let's try again and turn mistakes into superpowers! 💥"
                            icon={mistakesImg}
                            bgColor="#FFF3C4" // Light yellow
                            onClick={() => navigate("/child/practice/mistakes")}
                        />

                        <PracticeCard
                            title="Story Adventures"
                            subtitle="Jump into a storybook adventure and read along with friends 📖"
                            icon={readingImg}
                            bgColor="#D9F1FF" // Light blue
                            onClick={() => console.log("Stories clicked")}
                        />
                    </Box>

                    {/* Faint background decor in bottom right of main column */}
                    <BackgroundDecor />
                </Box>

                {/* Right Column: Stats & Widgets */}
                <Box
                    sx={{
                        width: { xs: "100%", lg: 320 },
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                        <TopBarStats
                            totalXp={stats.totalXp}
                            streak={stats.streak}
                            gems={stats.gems}
                        />
                    </Box>

                    <LeaderboardCard />
                    <DailyQuestCard />
                </Box>
            </Box>
        </Box>
    );
}
