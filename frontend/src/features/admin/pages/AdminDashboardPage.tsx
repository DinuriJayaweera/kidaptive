import { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Grid, CircularProgress, LinearProgress, Chip,
} from "@mui/material";
import {
    People as PeopleIcon,
    Person as PersonIcon,
    Quiz as QuizIcon,
    AutoAwesome as XPIcon,
    Speed as SpeedIcon,
    Storage as DbIcon,
    Memory as MemoryIcon,
    Timer as TimerIcon,
    School as SchoolIcon,
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendIcon,
} from "@mui/icons-material";
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as ReTooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../auth/context/AuthContext";
import { getDashboardData, type DashboardData, type RecentActivityItem } from "../api/adminDashboardApi";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatXP(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function timeAgo(dateStr: string | Date): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

const fmtDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
    icon, label, value, sub, bg,
}: {
    icon: React.ReactNode; label: string; value: string; sub?: string; bg: string;
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: "16px", p: 2.5,
                background: "var(--card-bg)", border: "1px solid var(--border-color)",
                display: "flex", alignItems: "center", gap: 2,
                transition: "box-shadow 0.2s, transform 0.2s",
                "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transform: "translateY(-2px)" },
            }}
        >
            <Box sx={{
                width: 52, height: 52, borderRadius: "14px", background: bg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                    fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)",
                    fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.4px", mb: 0.3,
                }}>
                    {label}
                </Typography>
                <Typography sx={{
                    fontFamily: "'Baloo 2', cursive", color: "var(--text-primary)",
                    fontWeight: 800, fontSize: 26, lineHeight: 1,
                }}>
                    {value}
                </Typography>
                {sub && (
                    <Typography sx={{
                        fontFamily: "'Poppins', sans-serif", color: "var(--text-tertiary)",
                        fontSize: 11, mt: 0.4,
                    }}>
                        {sub}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

// ── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: {
    title: string; subtitle?: string; children: React.ReactNode;
}) {
    return (
        <Paper elevation={0} sx={{
            borderRadius: "16px", p: 3,
            background: "var(--card-bg)", border: "1px solid var(--border-color)", height: "100%",
        }}>
            <Typography sx={{
                fontFamily: "'Baloo 2', cursive", color: "var(--text-primary)",
                fontWeight: 700, fontSize: 15, mb: subtitle ? 0.3 : 2,
            }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography sx={{
                    fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)",
                    fontSize: 12, mb: 2,
                }}>
                    {subtitle}
                </Typography>
            )}
            {children}
        </Paper>
    );
}

// ── Custom Chart Tooltip ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
    active?: boolean; payload?: Array<{ dataKey: string; name: string; value: number | null; color: string }>; label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{
            background: "var(--card-bg)", border: "1px solid var(--border-color)",
            borderRadius: "10px", p: 1.5, boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}>
            <Typography sx={{
                fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600,
                color: "var(--text-secondary)", mb: 0.5,
            }}>
                {label ? fmtDate(label) : ""}
            </Typography>
            {payload.map((p, i) => (
                <Typography key={`${p.dataKey}-${i}`} sx={{
                    fontFamily: "'Poppins', sans-serif", fontSize: 13,
                    fontWeight: 700, color: p.color, lineHeight: 1.6,
                }}>
                    {p.name}: {p.value != null ? p.value : "—"}{p.dataKey === "avgScore" ? "%" : ""}
                </Typography>
            ))}
        </Box>
    );
}

// ── Health Row ────────────────────────────────────────────────────────────────
type HealthStatus = "good" | "warn" | "bad";

const healthColors: Record<HealthStatus, string> = {
    good: "#22c55e", warn: "#f59e0b", bad: "#ef4444",
};
const healthBgs: Record<HealthStatus, string> = {
    good: "rgba(34,197,94,0.12)", warn: "rgba(245,158,11,0.12)", bad: "rgba(239,68,68,0.12)",
};
const healthLabels: Record<HealthStatus, string> = {
    good: "Good", warn: "Warn", bad: "High",
};

function HealthRow({ icon, label, value, status, bar }: {
    icon: React.ReactNode; label: string; value: string;
    status: HealthStatus; bar?: number;
}) {
    return (
        <Box sx={{
            display: "flex", alignItems: "center", gap: 1.5, py: 1.5,
            borderBottom: "1px solid var(--border-light)",
            "&:last-of-type": { borderBottom: "none" },
        }}>
            <Box sx={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", flexShrink: 0 }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                    fontFamily: "'Poppins', sans-serif", fontSize: 12,
                    color: "var(--text-secondary)", mb: bar !== undefined ? 0.5 : 0,
                }}>
                    {label}
                </Typography>
                {bar !== undefined && (
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(100, bar)}
                        sx={{
                            height: 4, borderRadius: 2, bgcolor: "var(--bg-subtle)",
                            "& .MuiLinearProgress-bar": {
                                bgcolor: healthColors[status], borderRadius: 2,
                            },
                        }}
                    />
                )}
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.3, flexShrink: 0 }}>
                <Typography sx={{
                    fontFamily: "'Baloo 2', cursive", fontSize: 15,
                    fontWeight: 700, color: "var(--text-primary)",
                }}>
                    {value}
                </Typography>
                <Box sx={{ px: 1, py: 0.2, borderRadius: "6px", bgcolor: healthBgs[status] }}>
                    <Typography sx={{
                        fontFamily: "'Poppins', sans-serif", fontSize: 9, fontWeight: 700,
                        color: healthColors[status], textTransform: "uppercase", letterSpacing: "0.5px",
                    }}>
                        {healthLabels[status]}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

// ── Activity Item ─────────────────────────────────────────────────────────────
const activityIcons: Record<RecentActivityItem["type"], React.ReactNode> = {
    quiz_complete: <QuizIcon sx={{ fontSize: 15, color: "#25AFF4" }} />,
    xp_earned: <XPIcon sx={{ fontSize: 15, color: "#FFCC35" }} />,
    practice: <SchoolIcon sx={{ fontSize: 15, color: "#8EE870" }} />,
};
const activityBgs: Record<RecentActivityItem["type"], string> = {
    quiz_complete: "rgba(37,175,244,0.1)",
    xp_earned: "rgba(255,204,53,0.1)",
    practice: "rgba(142,232,112,0.1)",
};

function ActivityItem({ item }: { item: RecentActivityItem }) {
    return (
        <Box sx={{
            display: "flex", gap: 1.5, py: 1.5,
            borderBottom: "1px solid var(--border-light)",
            "&:last-child": { borderBottom: "none" },
        }}>
            <Box sx={{
                width: 30, height: 30, borderRadius: "8px",
                bgcolor: activityBgs[item.type],
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                {activityIcons[item.type]}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Typography sx={{
                        fontFamily: "'Poppins', sans-serif", fontSize: 12,
                        fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {item.childName}
                    </Typography>
                    <Typography sx={{
                        fontFamily: "'Poppins', sans-serif", fontSize: 10,
                        color: "var(--text-tertiary)", flexShrink: 0,
                    }}>
                        {timeAgo(item.createdAt)}
                    </Typography>
                </Box>
                <Typography sx={{
                    fontFamily: "'Poppins', sans-serif", fontSize: 11,
                    color: "var(--text-secondary)", mt: 0.2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {item.description}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, mt: 0.4, flexWrap: "wrap" }}>
                    {item.score != null && (
                        <Chip
                            label={`${item.score}%`}
                            size="small"
                            sx={{
                                height: 18, fontSize: 10, fontWeight: 700,
                                fontFamily: "'Poppins', sans-serif",
                                bgcolor: item.score >= 70 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                                color: item.score >= 70 ? "#15803d" : "#dc2626",
                                border: "none",
                            }}
                        />
                    )}
                    {item.xp != null && item.xp > 0 && item.type !== "quiz_complete" && (
                        <Chip
                            label={`+${item.xp} XP`}
                            size="small"
                            sx={{
                                height: 18, fontSize: 10, fontWeight: 700,
                                fontFamily: "'Poppins', sans-serif",
                                bgcolor: "rgba(255,204,53,0.12)", color: "#a16207", border: "none",
                            }}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardData()
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <CircularProgress sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    const stats = data?.stats;
    const health = data?.platformHealth;
    const memPct = health ? Math.round((health.memoryUsageMB / health.memoryTotalMB) * 100) : 0;

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* ── Page Header ── */}
            <Typography variant="h5" sx={{
                fontFamily: "'Baloo 2', cursive", fontWeight: 700,
                color: "var(--text-primary)", mb: 0.5,
            }}>
                Welcome back, {user?.name} 👋
            </Typography>
            <Typography sx={{
                fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)",
                fontSize: 14, mb: 4,
            }}>
                Here's what's happening on the Kidaptive platform today.
            </Typography>

            {/* ── Stat Cards ── */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        icon={<PeopleIcon sx={{ fontSize: 26, color: "#25AFF4" }} />}
                        label="Platform Users"
                        value={stats ? stats.totalUsers.toLocaleString() : "—"}
                        sub={stats ? `+${stats.newUsersThisWeek} joined this week` : undefined}
                        bg="rgba(37,175,244,0.12)"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        icon={<PersonIcon sx={{ fontSize: 26, color: "#8EE870" }} />}
                        label="Active Learners Today"
                        value={stats ? stats.activeChildrenToday.toLocaleString() : "—"}
                        sub="unique children active"
                        bg="rgba(142,232,112,0.12)"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        icon={<QuizIcon sx={{ fontSize: 26, color: "#FFCC35" }} />}
                        label="Quizzes Today"
                        value={stats ? stats.quizzesToday.toLocaleString() : "—"}
                        sub="completed today"
                        bg="rgba(255,204,53,0.12)"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        icon={<XPIcon sx={{ fontSize: 26, color: "#8b5cf6" }} />}
                        label="Total XP Earned"
                        value={stats ? formatXP(stats.totalXP) : "—"}
                        sub="across all learners"
                        bg="rgba(139,92,246,0.12)"
                    />
                </Grid>
            </Grid>

            {/* ── Registration & Activity Line Charts ── */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <ChartCard title="User Registrations" subtitle="New parents & children — last 30 days">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart
                                data={data?.trends.userGrowth ?? []}
                                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="gradParents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#25AFF4" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#25AFF4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradChildren" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8EE870" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8EE870" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={fmtDate}
                                    tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fill: "var(--text-tertiary)" }}
                                    interval={5}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fill: "var(--text-tertiary)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <ReTooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, paddingTop: 8 }} />
                                <Area
                                    type="monotone" dataKey="parents" name="Parents"
                                    stroke="#25AFF4" strokeWidth={2} fill="url(#gradParents)" dot={false}
                                />
                                <Area
                                    type="monotone" dataKey="children" name="Children"
                                    stroke="#8EE870" strokeWidth={2} fill="url(#gradChildren)" dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <ChartCard title="Daily Quiz Activity" subtitle="Quizzes completed — last 30 days">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart
                                data={data?.trends.activityTrend ?? []}
                                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="gradQuizzes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FFCC35" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#FFCC35" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={fmtDate}
                                    tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fill: "var(--text-tertiary)" }}
                                    interval={5}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fill: "var(--text-tertiary)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <ReTooltip content={<ChartTooltip />} />
                                <Area
                                    type="monotone" dataKey="quizzes" name="Quizzes"
                                    stroke="#FFCC35" strokeWidth={2.5} fill="url(#gradQuizzes)" dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </Grid>
            </Grid>

            {/* ── Average Score Trend ── */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid size={{ xs: 12 }}>
                    <ChartCard title="Average Quiz Score Trend" subtitle="Rolling daily average across all categories — last 30 days">
                        <ResponsiveContainer width="100%" height={190}>
                            <LineChart
                                data={data?.trends.scoreTrend ?? []}
                                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={fmtDate}
                                    tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fill: "var(--text-tertiary)" }}
                                    interval={5}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, fill: "var(--text-tertiary)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <ReTooltip content={<ChartTooltip />} />
                                {/* Reference line at 70% pass threshold */}
                                <Line
                                    type="monotone" dataKey="avgScore" name="Avg Score"
                                    stroke="#8b5cf6" strokeWidth={2.5} dot={false} connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                            <Box sx={{ width: 24, height: 2, bgcolor: "rgba(239,68,68,0.4)", borderRadius: 1 }} />
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>
                                70% pass threshold
                            </Typography>
                            <TrendIcon sx={{ fontSize: 14, color: "#8b5cf6", ml: "auto" }} />
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: "#8b5cf6" }}>
                                Score trend (purple)
                            </Typography>
                        </Box>
                    </ChartCard>
                </Grid>
            </Grid>

            {/* ── Platform Health + Recent Activity ── */}
            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{
                        borderRadius: "16px", p: 3,
                        background: "var(--card-bg)", border: "1px solid var(--border-color)", height: "100%",
                    }}>
                        <Typography sx={{
                            fontFamily: "'Baloo 2', cursive", color: "var(--text-primary)",
                            fontWeight: 700, fontSize: 15, mb: 0.4,
                        }}>
                            Platform Health
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)",
                            fontSize: 12, mb: 2,
                        }}>
                            Live server metrics at time of page load
                        </Typography>

                        {health ? (
                            <Box>
                                <HealthRow
                                    icon={<SpeedIcon sx={{ fontSize: 18 }} />}
                                    label="API Response Time"
                                    value={`${health.apiResponseTimeMs}ms`}
                                    status={health.apiResponseTimeMs < 300 ? "good" : health.apiResponseTimeMs < 800 ? "warn" : "bad"}
                                />
                                <HealthRow
                                    icon={<DbIcon sx={{ fontSize: 18 }} />}
                                    label="DB Query Time"
                                    value={`${health.dbQueryTimeMs}ms`}
                                    status={health.dbQueryTimeMs < 100 ? "good" : health.dbQueryTimeMs < 300 ? "warn" : "bad"}
                                />
                                <HealthRow
                                    icon={<MemoryIcon sx={{ fontSize: 18 }} />}
                                    label={`Heap Memory — ${health.memoryUsageMB} / ${health.memoryTotalMB} MB`}
                                    value={`${memPct}%`}
                                    status={memPct < 70 ? "good" : memPct < 85 ? "warn" : "bad"}
                                    bar={memPct}
                                />
                                <HealthRow
                                    icon={<TimerIcon sx={{ fontSize: 18 }} />}
                                    label="Process Uptime"
                                    value={formatUptime(health.uptime)}
                                    status="good"
                                />

                                {/* System info strip */}
                                <Box sx={{ display: "flex", gap: 3, pt: 2.5, flexWrap: "wrap" }}>
                                    <Box>
                                        <Typography sx={{
                                            fontFamily: "'Poppins', sans-serif", fontSize: 10,
                                            color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.4px",
                                        }}>
                                            Node.js
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: "'Baloo 2', cursive", fontSize: 14,
                                            fontWeight: 700, color: "var(--text-primary)",
                                        }}>
                                            {health.nodeVersion}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{
                                            fontFamily: "'Poppins', sans-serif", fontSize: 10,
                                            color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.4px",
                                        }}>
                                            System RAM
                                        </Typography>
                                        <Typography sx={{
                                            fontFamily: "'Baloo 2', cursive", fontSize: 14,
                                            fontWeight: 700, color: "var(--text-primary)",
                                        }}>
                                            {health.systemFreeMemoryGB} GB free / {health.systemMemoryGB} GB
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontSize: 13 }}>
                                No data available.
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{
                        borderRadius: "16px", p: 3,
                        background: "var(--card-bg)", border: "1px solid var(--border-color)", height: "100%",
                    }}>
                        <Typography sx={{
                            fontFamily: "'Baloo 2', cursive", color: "var(--text-primary)",
                            fontWeight: 700, fontSize: 15, mb: 0.4,
                        }}>
                            Recent Activity
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)",
                            fontSize: 12, mb: 2,
                        }}>
                            Latest learner events across the platform
                        </Typography>

                        {data?.recentActivity.length ? (
                            <Box>
                                {data.recentActivity.map((item, i) => (
                                    <ActivityItem key={i} item={item} />
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: "center", py: 5 }}>
                                <TrophyIcon sx={{ fontSize: 36, color: "var(--border-color)", mb: 1 }} />
                                <Typography sx={{
                                    fontFamily: "'Poppins', sans-serif",
                                    color: "var(--text-secondary)", fontSize: 13,
                                }}>
                                    No learner activity yet. Check back once children start using the platform.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
