import { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, Grid } from "@mui/material";
import {
    People as PeopleIcon,
    Assessment as ScoreIcon,
    CheckCircle as CompletionIcon,
    Quiz as QuizIcon,
} from "@mui/icons-material";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
    ResponsiveContainer, Cell,
} from "recharts";
import { getPerformanceData, type PerformanceData } from "../api/adminPerformanceApi";

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, bg, suffix = "" }: {
    icon: React.ReactNode; label: string; value: number; bg: string; suffix?: string;
}) {
    return (
        <Paper elevation={0} sx={{ borderRadius: "16px", p: 2.5, background: "#fff", border: "1px solid #e8ecf1", display: "flex", alignItems: "center", gap: 2, transition: "box-shadow 0.2s, transform 0.2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transform: "translateY(-2px)" } }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontSize: 11, fontWeight: 600, mb: 0.4, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {label}
                </Typography>
                <Typography sx={{ fontFamily: "'Baloo 2', cursive", color: "#111827", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>
                    {value.toLocaleString()}{suffix}
                </Typography>
            </Box>
        </Paper>
    );
}

// ── Custom Bar Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ background: "#fff", border: "1px solid #e8ecf1", borderRadius: "10px", p: 1.5, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, color: "#6b7280", mb: 0.5 }}>
                Age {label}
            </Typography>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 700, color: "#25AFF4" }}>
                {payload[0].value}% avg score
            </Typography>
        </Box>
    );
}

const BAR_COLORS = ["#25AFF4", "#5bc8f7", "#96dffb"];

// ── Pass Rate Badge ────────────────────────────────────────────────────────────
function PassRateBadge({ rate }: { rate: number }) {
    const color = rate >= 75 ? "#15803d" : rate >= 50 ? "#a16207" : "#dc2626";
    const border = rate >= 75 ? "#bbf7d0" : rate >= 50 ? "#fde68a" : "#fecaca";
    const bg = rate >= 75 ? "#f0fdf4" : rate >= 50 ? "#fefce8" : "#fef2f2";
    return (
        <Box sx={{ px: 1, py: 0.4, borderRadius: "6px", background: bg, border: `1px solid ${border}`, display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Pass Rate {rate}%
            </Typography>
        </Box>
    );
}

// ── Circular Score ─────────────────────────────────────────────────────────────
function CircularScore({ score }: { score: number }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <Box sx={{ position: "relative", width: 140, height: 140, mx: "auto" }}>
            <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                <circle cx="70" cy="70" r={r} fill="none" stroke="#fff" strokeWidth="10"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            </svg>
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: 32, color: "#fff", lineHeight: 1 }}>
                    {score}%
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Global Avg
                </Typography>
            </Box>
        </Box>
    );
}

// ── Weak Category Card ──────────────────────────────────────────────────────────
function WeakCard({ name, score }: { name: string; score: number }) {
    const barColor = score < 45 ? "#ef4444" : score < 55 ? "#f97316" : "#eab308";
    return (
        <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid #f3f4f6", background: "#fafafa" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", background: "#fff3f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "2px", background: barColor }} />
                </Box>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: "#111827" }}>
                    {name}
                </Typography>
            </Box>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#6b7280", mb: 1 }}>
                Average Score: {score}%
            </Typography>
            <Box sx={{ height: 6, borderRadius: "3px", background: "#f3f4f6", overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: `${score}%`, borderRadius: "3px", background: barColor, transition: "width 0.8s ease" }} />
            </Box>
        </Box>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PerformancePage() {
    const [data, setData] = useState<PerformanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getPerformanceData()
            .then((d) => { if (active) setData(d); })
            .catch(() => {})
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <CircularProgress sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    const stats = data?.stats;
    const chartData = data?.performanceByAgeGroup ?? [];
    const mostAttempted = data?.mostAttemptedCategories ?? [];
    const weakCategories = data?.weakCategories ?? [];

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
                <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", fontSize: { xs: "1.5rem", md: "1.85rem" }, mb: 0.5 }}>
                    Performance
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#6b7280", fontSize: { xs: "0.875rem", md: "0.95rem" } }}>
                    Real-time performance data across all learning modules
                </Typography>
            </Box>

            {/* Overview Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard icon={<PeopleIcon sx={{ fontSize: 24, color: "#25AFF4" }} />} label="Total Active Users" value={stats?.totalActiveUsers ?? 0} bg="#e0f2fe" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard icon={<ScoreIcon sx={{ fontSize: 24, color: "#8b5cf6" }} />} label="Avg. Placement Score" value={stats?.avgPlacementScore ?? 0} bg="#f5f3ff" suffix="%" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard icon={<CompletionIcon sx={{ fontSize: 24, color: "#16a34a" }} />} label="Completion Rate" value={stats?.completionRate ?? 0} bg="#f0fdf4" suffix="%" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard icon={<QuizIcon sx={{ fontSize: 24, color: "#f59e0b" }} />} label="Weekly Quizzes Taken" value={stats?.weeklyQuizzesTaken ?? 0} bg="#fffbeb" />
                </Grid>
            </Grid>

            {/* Middle row: Bar Chart + Most Attempted */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Bar Chart */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e8ecf1", background: "#fff", p: 3, height: "100%" }}>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", mb: 0.4 }}>
                            Performance by Age Group
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#6b7280", mb: 3 }}>
                            Comparing average placement scores per age group
                        </Typography>
                        {chartData.every((d) => d.avgScore === 0) ? (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, color: "#94a3b8" }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 14 }}>No placement data yet</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={chartData} barSize={40} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                    <XAxis dataKey="ageGroup" tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.05)" }} />
                                    <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                                        {chartData.map((_, i) => (
                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        <Box sx={{ display: "flex", gap: 2.5, mt: 2, flexWrap: "wrap" }}>
                            {chartData.map((d, i) => (
                                <Box key={d.ageGroup} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: BAR_COLORS[i % BAR_COLORS.length] }} />
                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#6b7280" }}>Ages {d.ageGroup}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Most Attempted */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e8ecf1", background: "#fff", p: 3, height: "100%" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: "#111827" }}>
                                Most Attempted Categories
                            </Typography>
                        </Box>
                        {mostAttempted.length === 0 ? (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#94a3b8" }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 14 }}>No quiz data yet</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                {mostAttempted.map((item, idx) => (
                                    <Box key={item.categoryName} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.75, borderBottom: idx < mostAttempted.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                        <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "#e0f7fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 700, color: "#25AFF4" }}>
                                                {String(idx + 1).padStart(2, "0")}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {item.categoryName}
                                            </Typography>
                                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#94a3b8" }}>
                                                {item.totalAttempts.toLocaleString()} attempts
                                            </Typography>
                                        </Box>
                                        <PassRateBadge rate={item.passRate} />
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom row: Weak Categories + Avg Placement Score */}
            <Grid container spacing={3}>
                {/* Weak Categories */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e8ecf1", background: "#fff", p: 3 }}>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", mb: 0.4 }}>
                            Weak Categories
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "#6b7280", mb: 2.5 }}>
                            Categories requiring instructional focus (avg score &lt; 65%)
                        </Typography>
                        {weakCategories.length === 0 ? (
                            <Box sx={{ py: 4, textAlign: "center" }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#94a3b8", fontSize: 14 }}>
                                    No weak categories — great performance!
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                {weakCategories.map((cat) => (
                                    <WeakCard key={cat.categoryName} name={cat.categoryName} score={cat.avgScore} />
                                ))}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Avg Placement Score Card */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ borderRadius: "16px", background: "linear-gradient(135deg, #25AFF4 0%, #0ea5e9 100%)", p: 3, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2.5, minHeight: 260 }}>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", textAlign: "center" }}>
                            Average Placement Test Score
                        </Typography>
                        <CircularScore score={stats?.avgPlacementScore ?? 0} />
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 1.6 }}>
                            Highest scores seen in the platform based on all completed placement tests
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
