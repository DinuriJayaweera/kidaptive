import { Box, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { getDashboardData } from "../services/quizApi";
import { placementTestApi } from "../services/placementTestApi";
import ChildSidebar from "../components/ChildSidebar";
import TopBarStats from "../components/TopBarStats";
import CategoryGrid from "../components/CategoryGrid";
import LeaderboardCard from "../components/LeaderboardCard";
import DailyQuestCard from "../components/DailyQuestCard";
import type { CategoryData } from "../components/CategoryCard";

export default function ChildDashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [dashboardData, setDashboardData] = useState<{
        stats: { totalXp: number, streak: number, gems: number };
        categories: CategoryData[];
    } | null>(null);

    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        placementTestApi.getStatus()
            .then(({ data }) => {
                if (!data.placementCompleted) {
                    navigate("/child/placement", { replace: true });
                } else {
                    setCheckingStatus(false);
                    getDashboardData()
                        .then((d) => setDashboardData(d))
                        .catch((err) => console.error("Failed to load dashboard data:", err));
                }
            })
            .catch(() => {
                navigate("/child/placement", { replace: true });
            });
    }, [navigate]);

    const handleCategoryClick = (id: string, _level: string) => {
        navigate(`/child/category-progress/${id}`);
    };

    if (checkingStatus || !dashboardData) {
        return (
            <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F8FB", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: "100vh",
            backgroundColor: "#F4F8FB",
            display: "flex",
            overflow: "hidden",
        }}>
            {/* ── Left Sidebar: pass activePage="LEARN" ── */}
            <ChildSidebar activePage="LEARN" />

            {/* ── Main Content Area ── */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    gap: 4,
                    p: { xs: 2, sm: 3, md: 4 },
                    overflowY: "auto",
                }}
            >
                {/* Center Column: Grid */}
                <Box sx={{ flex: 1, pt: 2 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            sx={{
                                fontFamily: "'Baloo 2', sans-serif",
                                fontWeight: 800,
                                fontSize: { xs: "1.6rem", sm: "2rem", md: "2.4rem" },
                                color: "#1A202C",
                                lineHeight: 1.2,
                            }}
                        >
                            Hi {user?.name ?? "Learner"}, ready to learn today? 😊
                        </Typography>
                    </Box>

                    <CategoryGrid
                        categories={dashboardData.categories}
                        onCategoryClick={handleCategoryClick}
                    />
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
                            totalXp={dashboardData.stats.totalXp}
                            streak={dashboardData.stats.streak}
                            gems={dashboardData.stats.gems}
                        />
                    </Box>

                    <LeaderboardCard />
                    <DailyQuestCard />
                </Box>
            </Box>
        </Box>
    );
}