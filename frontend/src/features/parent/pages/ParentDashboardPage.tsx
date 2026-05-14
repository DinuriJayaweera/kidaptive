import { useState, useEffect } from "react";
import { Box, Typography, Grid, CircularProgress, Alert, Paper } from "@mui/material";
import {
    School as SchoolIcon,
    ChildCare as ChildIcon,
    Equalizer as XpIcon,
    AutoAwesome as GemsIcon,
} from "@mui/icons-material";
import { useAuth } from "../../auth/context/AuthContext";
import { getParentChildrenEnriched } from "../api/parentApi";
import type { EnhancedChildProfile } from "../api/parentApi";
import { getRatingPromptStatus } from "../api/ratingApi";
import RatingPromptModal from "../components/RatingPromptModal";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

export default function ParentDashboardPage() {
    const { user } = useAuth();
    const [children, setChildren] = useState<EnhancedChildProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showRating, setShowRating] = useState(false);

    useEffect(() => {
        getParentChildrenEnriched()
            .then(setChildren)
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load dashboard data."))
            .finally(() => setLoading(false));
    }, []);

    // Check rating prompt after a short delay so the dashboard renders first
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const status = await getRatingPromptStatus();
                if (status.shouldShow) setShowRating(true);
            } catch { /* silent */ }
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const totalXp = children.reduce((acc, c) => acc + (c.totalXP || 0), 0);
    const totalGems = children.reduce((acc, c) => acc + (c.gems || 0), 0);
    const activeLearners = children.filter(c => c.lastPlayedDate).length;

    const statCards = [
        { label: "Total Children", icon: <ChildIcon sx={{ fontSize: 32, color: "#25AFF4" }} />, value: loading ? "—" : children.length, bgClass: "badge-blue" },
        { label: "Active Learners", icon: <SchoolIcon sx={{ fontSize: 32, color: "#FFCC35" }} />, value: loading ? "—" : activeLearners, bgClass: "badge-yellow" },
        { label: "Total XP", icon: <XpIcon sx={{ fontSize: 32, color: "#8EE870" }} />, value: loading ? "—" : totalXp, bgClass: "badge-green" },
        { label: "Total Gems", icon: <GemsIcon sx={{ fontSize: 32, color: "#a855f7" }} />, value: loading ? "—" : totalGems, bgClass: "badge-purple" },
    ];

    // Build chart data: each child as a bar, showing their XP and Gems
    const childChartData = children.map(c => ({
        name: c.name,
        xp: c.totalXP || 0,
        gems: c.gems || 0,
    }));

    // Category breakdown across all children
    const categoryDataMap = children.flatMap(c => c.categories).reduce((acc, cat) => {
        if (!acc[cat.categoryId]) acc[cat.categoryId] = { name: cat.categoryId.charAt(0).toUpperCase() + cat.categoryId.slice(1), xp: 0 };
        acc[cat.categoryId].xp += cat.xp;
        return acc;
    }, {} as Record<string, { name: string; xp: number }>);

    const categoryChartData = Object.values(categoryDataMap);

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}>
                        Platform Overview
                    </Typography>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontSize: 14 }}>
                        Welcome back, {user?.name}. Here's how your children are performing overall.
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((card) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
                        <Paper elevation={0} sx={{ borderRadius: "16px", p: 3, background: "var(--card-bg)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 2, transition: "box-shadow 0.2s, transform 0.2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transform: "translateY(-2px)" } }}>
                            <Box className={`stat-icon-wrap ${card.bgClass}`} sx={{ p: 1.5, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {card.icon}
                            </Box>
                            <Box>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, mb: 0.3, textTransform: "uppercase" }}>{card.label}</Typography>
                                <Typography sx={{ fontFamily: "'Baloo 2', cursive", color: "var(--text-primary)", fontWeight: 700, fontSize: 28, lineHeight: 1 }}>{card.value}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Charts Section */}
            {loading ? (
                <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
            ) : children.length > 0 ? (
                <Grid container spacing={3}>
                    {/* Child XP & Gems Comparison */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, mb: 3, textTransform: "uppercase" }}>Child Performance Comparison</Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={childChartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
                                    <Legend wrapperStyle={{ bottom: 0 }} />
                                    <Bar dataKey="xp" fill="#FFCC35" name="XP" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Category XP Breakdown */}
                    {categoryChartData.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, mb: 3, textTransform: "uppercase" }}>XP by Category</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={categoryChartData} margin={{ top: 5, right: 20, left: 0, bottom: 45 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" />
                                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
                                        <Bar dataKey="xp" fill="#8EE870" name="XP" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: "16px", p: 5, background: "var(--card-bg)", border: "1px solid var(--border-color)", textAlign: "center", mt: 4 }}>
                    <Typography variant="h6" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, mb: 1, color: "var(--text-tertiary)" }}>No Analytics Available Yet</Typography>
                    <Typography sx={{ color: "var(--text-tertiary)", fontSize: 14 }}>Once your children start playing lessons and earning XP, their activity charts will appear here.</Typography>
                </Paper>
            )}

            <RatingPromptModal open={showRating} onClose={() => setShowRating(false)} />
        </Box>
    );
}