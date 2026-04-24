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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Delay chart render until after the browser has painted and computed layout.
        // requestAnimationFrame guarantees at least one frame has been drawn,
        // so ResponsiveContainer can measure real pixel dimensions (not -1x-1).
        const raf = requestAnimationFrame(() => {
            setMounted(true);
        });

        getParentChildrenEnriched()
            .then(setChildren)
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load dashboard data."))
            .finally(() => setLoading(false));

        return () => cancelAnimationFrame(raf);
    }, []);

    const totalXp = children.reduce((acc, c) => acc + (c.totalXP || 0), 0);
    const totalGems = children.reduce((acc, c) => acc + (c.gems || 0), 0);
    const activeLearners = children.filter(c => c.lastPlayedDate).length;

    const statCards = [
        { label: "Total Children", icon: <ChildIcon sx={{ fontSize: 32, color: "#25AFF4" }} />, value: loading ? "—" : children.length, bg: "#e0f2fe" },
        { label: "Active Learners", icon: <SchoolIcon sx={{ fontSize: 32, color: "#FFCC35" }} />, value: loading ? "—" : activeLearners, bg: "#fffbeb" },
        { label: "Total XP", icon: <XpIcon sx={{ fontSize: 32, color: "#8EE870" }} />, value: loading ? "—" : totalXp, bg: "#f0fdf4" },
        { label: "Total Gems", icon: <GemsIcon sx={{ fontSize: 32, color: "#a855f7" }} />, value: loading ? "—" : totalGems, bg: "#faf5ff" },
    ];

    // Build chart data: each child as a bar, showing their XP and Gems
    const childChartData = children.map(c => ({
        name: c.name,
        xp: c.totalXP || 0,
        gems: c.gems || 0,
    }));

    // Category breakdown across all children
    const categoryDataMap = children.flatMap(c => c.categories).reduce((acc, cat) => {
        if(!acc[cat.categoryId]) acc[cat.categoryId] = { name: cat.categoryId.charAt(0).toUpperCase() + cat.categoryId.slice(1), xp: 0 };
        acc[cat.categoryId].xp += cat.xp;
        return acc;
    }, {} as Record<string, {name: string; xp: number}>);

    const categoryChartData = Object.values(categoryDataMap);

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#111827", mb: 0.5 }}>
                        Platform Overview
                    </Typography>
                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontSize: 14 }}>
                        Welcome back, {user?.name}. Here's how your children are performing overall.
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((card) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
                        <Paper elevation={0} sx={{ borderRadius: "16px", p: 3, background: "#fff", border: "1px solid #e8ecf1", display: "flex", alignItems: "center", gap: 2, transition: "box-shadow 0.2s, transform 0.2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transform: "translateY(-2px)" } }}>
                            <Box sx={{ p: 1.5, borderRadius: "16px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)" }}>
                                {card.icon}
                            </Box>
                            <Box>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontSize: 12, fontWeight: 600, mb: 0.3, textTransform: "uppercase" }}>{card.label}</Typography>
                                <Typography sx={{ fontFamily: "'Baloo 2', cursive", color: "#111827", fontWeight: 700, fontSize: 28, lineHeight: 1 }}>{card.value}</Typography>
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
                        <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "#fff", border: "1px solid #e8ecf1" }}>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#6b7280", fontWeight: 600, mb: 3, textTransform: "uppercase" }}>Child Performance Comparison</Typography>
                            <Box sx={{ width: '100%', height: 300, minHeight: 100 }}>
                                {mounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                        <BarChart data={childChartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} interval={0} />
                                            <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ bottom: 0 }} />
                                            <Bar dataKey="xp" fill="#FFCC35" name="XP" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Category XP Breakdown */}
                    {categoryChartData.length > 0 && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "#fff", border: "1px solid #e8ecf1" }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "#6b7280", fontWeight: 600, mb: 3, textTransform: "uppercase" }}>XP by Category</Typography>
                                <Box sx={{ width: '100%', height: 300, minHeight: 100 }}>
                                    {mounted && (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <BarChart data={categoryChartData} margin={{ top: 5, right: 20, left: 0, bottom: 45 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" />
                                                <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="xp" fill="#8EE870" name="XP" radius={[6, 6, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: "16px", p: 5, background: "#fff", border: "1px solid #e8ecf1", textAlign: "center", mt: 4 }}>
                    <Typography variant="h6" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, mb: 1, color: "#94a3b8" }}>No Analytics Available Yet</Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>Once your children start playing lessons and earning XP, their activity charts will appear here.</Typography>
                </Paper>
            )}
        </Box>
    );
}