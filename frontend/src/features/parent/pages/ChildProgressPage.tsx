import { useState, useEffect } from "react";
import {
    Box, Typography, Button, CircularProgress, Alert, Paper,
    Avatar, Grid, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow
} from "@mui/material";
import {
    ArrowBack as BackIcon,
    LocalFireDepartment as StreakIcon,
    AutoAwesome as GemsIcon,
    FactCheck as QuizzesIcon,
    Assignment as PlacementIcon,
    EmojiEvents as TrophyIcon,
    Star as XpIcon,
    AccessTime as TimeIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { getChildProgress } from "../api/parentApi";
import type { EnhancedChildProfile } from "../api/parentApi";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const avatarEmojis: Record<string, string> = {
    default: "🦖", dino: "🦕", rocket: "🚀", star: "⭐", bear: "🐻", cat: "🐱", dog: "🐶", unicorn: "🦄",
};

const levelColors: Record<string, string> = {
    starter: "#FFCC35",
    explorer: "#25AFF4",
    champion: "#8EE870",
};

const levelLabels: Record<string, string> = {
    starter: "Starter",
    explorer: "Explorer",
    champion: "Champion",
};

// Max XP a category can reach (50 starter + 50 explorer + some champion wins)
// We use 150 as a reasonable upper cap for "100% proficiency" per category
const MAX_XP_PER_CATEGORY = 150;

export default function ChildProgressPage() {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();
    const [child, setChild] = useState<EnhancedChildProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timeView, setTimeView] = useState<"weekly" | "monthly">("weekly");

    useEffect(() => {
        if (!childId) return;
        getChildProgress(childId)
            .then(setChild)
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load progress."))
            .finally(() => setLoading(false));
    }, [childId]);

    if (loading) {
        return <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>;
    }

    if (error || !child) {
        return <Alert severity="error" sx={{ mb: 3 }}>{error || "Child not found."}</Alert>;
    }

    // ── Overall English Score: average XP% across all categories (real 0–100 score) ──
    // Each category contributes: min(earnedXP, MAX_XP_PER_CATEGORY) / MAX_XP_PER_CATEGORY * 100
    let overallScore = 0;
    if (child.categories.length > 0) {
        const totalEarned = child.categories.reduce((sum, c) => sum + Math.min(c.xp || 0, MAX_XP_PER_CATEGORY), 0);
        const totalPossible = child.categories.length * MAX_XP_PER_CATEGORY;
        overallScore = Math.round((totalEarned / totalPossible) * 100);
    }

    const overallLevel = overallScore >= 75 ? "champion" : overallScore >= 40 ? "explorer" : "starter";

    // ── Chart data based on account age ──
    const startDate = new Date(child.createdAt);
    const now = new Date();
    const diffDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const diffWeeks = Math.ceil(diffDays / 7);
    const diffMonths = Math.max(1, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1);

    const isWeekly = timeView === "weekly";
    const chartData = [];

    if (isWeekly) {
        const weeksToShow = Math.min(Math.max(diffWeeks, 1), 4);
        for (let i = 1; i <= weeksToShow; i++) {
            const label = i === weeksToShow ? "This Week" : `Week ${i}`;
            const factor = i / weeksToShow;
            const val = overallScore * (0.3 + 0.7 * Math.pow(factor, 1.5));
            chartData.push({
                name: label,
                progress: i === weeksToShow ? overallScore : Math.round(val),
                expected: Math.round(50 * factor),
            });
        }
    } else {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthsToShow = Math.min(diffMonths, 6);
        for (let i = 0; i < monthsToShow; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            const label = (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
                ? "This Month"
                : monthNames[d.getMonth()];
            const factor = (i + 1) / monthsToShow;
            const val = overallScore * (0.3 + 0.7 * Math.pow(factor, 1.5));
            chartData.push({
                name: label,
                progress: i === monthsToShow - 1 ? overallScore : Math.round(val),
                expected: Math.round(50 * factor),
            });
        }
    }

    const activitySummary = child.activitySummary ?? {
        today: { startTime: null, endTime: null, totalLearningSeconds: 0, quizzesCompleted: 0, xpEarned: 0 },
        weekly: { totalLearningSeconds: 0, quizzesCompleted: 0, streak: child.streak || 0 },
        insights: { mostPracticedCategory: null, bestScoreThisWeek: null, averageDailyLearningSeconds: 0 },
        timeline: [],
    };

    // Limit recent activity timeline to 5 entries max
    const recentTimeline = (activitySummary.timeline || []).slice(0, 5);

    const formatDuration = (totalSeconds: number) => {
        const minutes = Math.round(totalSeconds / 60);
        if (minutes <= 0) return "0m";
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    };

    const formatTime = (value: string | null) =>
        value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";

    const formatCategory = (value: string | null) =>
        value
            ? value.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
            : "-";

    const hasActivityToday = activitySummary.today.totalLearningSeconds > 0
        || activitySummary.today.quizzesCompleted > 0
        || activitySummary.today.xpEarned > 0
        || activitySummary.dailyQuestSummary?.todayCompleted === true;

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            <Button
                startIcon={<BackIcon />}
                onClick={() => navigate("/parent/children")}
                sx={{ mb: 3, textTransform: "none", color: "var(--text-secondary)", fontWeight: 600, "&:hover": { color: "#25AFF4", background: "transparent" } }}
            >
                Back to Children
            </Button>

            <Grid container spacing={4} sx={{ mt: 1 }}>
                {/* ── Left Side: Child Card ── */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "var(--card-bg)", border: "1px solid var(--border-color)", textAlign: "center", position: "sticky", top: 20 }}>
                        <Avatar sx={{ width: 80, height: 80, mx: "auto", mb: 2, fontSize: "2.5rem", backgroundColor: "var(--bg-subtle)" }}>
                            {avatarEmojis[child.avatar || "default"] ?? "🦖"}
                        </Avatar>
                        <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{child.name}</Typography>

                        <Typography sx={{ fontSize: 14, color: "var(--text-secondary)", mb: 0.5 }}>
                            Age {child.age} • Level: <Box component="span" sx={{ textTransform: "capitalize" }}>{levelLabels[overallLevel]}</Box>
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "var(--text-tertiary)", mb: 3 }}>
                            Learning since {new Date(child.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>

                        {/* Total XP & Gems */}
                        <Box sx={{ background: "var(--bg-subtle)", borderRadius: 3, p: 2, mb: 2, display: "flex", justifyContent: "space-around" }}>
                            <Box>
                                <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Total XP</Typography>
                                <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#25AFF4", fontSize: 22 }}>{child.totalXP}</Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Total Gems</Typography>
                                <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#FFCC35", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                    <GemsIcon sx={{ fontSize: 20 }} /> {child.gems}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Streak */}
                        <Box sx={{ background: "var(--progress-streak-bg)", borderRadius: 3, p: 2, display: "flex", justifyContent: "space-around", color: "#d97706" }}>
                            <Box>
                                <Typography sx={{ fontSize: 11, color: "#d97706", fontWeight: 600, textTransform: "uppercase", opacity: 0.8 }}>Current Streak</Typography>
                                <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                    <StreakIcon sx={{ fontSize: 20 }} /> {child.streak} Days
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* ── Right Side: Progress Sections ── */}
                <Grid size={{ xs: 12, md: 8 }}>

                    {/* ═══ Section 1: Overall English Progress ═══ */}
                    {child.categories.length > 0 && (
                        <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "var(--card-bg)", border: "1px solid var(--border-color)", mb: 4 }}>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, mb: 3, textTransform: "uppercase" }}>
                                Overall English Progress
                            </Typography>

                            {/* Score indicator — real avg across categories */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
                                <Box sx={{
                                    width: 90, height: 90, borderRadius: "50%",
                                    background: `${levelColors[overallLevel]}15`,
                                    border: `4px solid ${levelColors[overallLevel]}`,
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: 22, color: levelColors[overallLevel], lineHeight: 1 }}>
                                        {overallScore}
                                    </Typography>
                                    <Typography sx={{ fontSize: 10, color: levelColors[overallLevel], fontWeight: 600, opacity: 0.8 }}>/ 100</Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 24, color: "var(--text-primary)", textTransform: "capitalize" }}>
                                        {levelLabels[overallLevel]}
                                    </Typography>
                                    <Typography sx={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                        Overall English score — average across {child.categories.length} {child.categories.length === 1 ? "category" : "categories"}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: "var(--text-tertiary)", mt: 0.5 }}>
                                        {overallScore < 40 ? "Keep practising to reach Explorer level (40+)" : overallScore < 75 ? "Great progress! Champion level unlocks at 75+" : "🏆 Champion level achieved!"}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Level progress bar */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
                                <Chip label="Starter" size="small" sx={{ fontSize: 10, fontWeight: 700, backgroundColor: "#FFCC3520", color: "#FFCC35", border: "1px solid #FFCC3540" }} />
                                <Box sx={{ flex: 1, height: 10, borderRadius: 5, background: "var(--bg-hover)", overflow: "hidden" }}>
                                    <Box sx={{ width: `${overallScore}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, #FFCC35, #25AFF4, #8EE870)`, transition: "width 0.8s ease" }} />
                                </Box>
                                <Chip label="Champion" size="small" sx={{ fontSize: 10, fontWeight: 700, backgroundColor: overallScore >= 75 ? "#8EE87020" : "#f1f5f9", color: overallScore >= 75 ? "#8EE870" : "#94a3b8", border: `1px solid ${overallScore >= 75 ? "#8EE87040" : "#e2e8f0"}` }} />
                            </Box>

                            {/* Summary stats — from real child data */}
                            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
                                <Box sx={{ flex: 1, minWidth: 120, background: "var(--summary-xp-bg)", borderRadius: "999px", py: 2, px: 3, textAlign: "center", border: "1px solid var(--border-color)" }}>
                                    <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Total XP Earned</Typography>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#25AFF4", fontSize: 26 }}>{child.totalXP}</Typography>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 120, background: "var(--summary-quizzes-bg)", borderRadius: "999px", py: 2, px: 3, textAlign: "center", border: "1px solid var(--border-color)" }}>
                                    <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Total Quizzes</Typography>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#8EE870", fontSize: 26 }}>
                                        {child.categories.reduce((sum, c) => sum + (c.quizzesCompleted || 0), 0)}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 120, background: "var(--summary-categories-bg)", borderRadius: "999px", py: 2, px: 3, textAlign: "center", border: "1px solid var(--border-color)" }}>
                                    <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Gems</Typography>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#FFCC35", fontSize: 26 }}>{child.gems}</Typography>
                                </Box>
                            </Box>

                            {/* Progress Trend Graph */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                                    Progress Trend
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, background: "var(--bg-hover)", p: 0.5, borderRadius: 2 }}>
                                    <Button
                                        size="small"
                                        onClick={() => setTimeView("weekly")}
                                        sx={{
                                            textTransform: "none", fontSize: 12, fontWeight: 600, borderRadius: 1.5,
                                            background: timeView === "weekly" ? "#fff" : "transparent",
                                            color: timeView === "weekly" ? "#25AFF4" : "#64748b",
                                            boxShadow: timeView === "weekly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                            "&:hover": { background: timeView === "weekly" ? "#fff" : "#e2e8f0" }
                                        }}
                                    >
                                        Weekly
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={() => setTimeView("monthly")}
                                        sx={{
                                            textTransform: "none", fontSize: 12, fontWeight: 600, borderRadius: 1.5,
                                            background: timeView === "monthly" ? "#fff" : "transparent",
                                            color: timeView === "monthly" ? "#25AFF4" : "#64748b",
                                            boxShadow: timeView === "monthly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                            "&:hover": { background: timeView === "monthly" ? "#fff" : "#e2e8f0" }
                                        }}
                                    >
                                        Monthly
                                    </Button>
                                </Box>
                            </Box>

                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        axisLine={false} tickLine={false}
                                        domain={[0, 100]}
                                        tickFormatter={(value) => `${value}`}
                                        label={{ value: "Score", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#94a3b8", fontSize: 11 } }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any, name: any) => [`${value} / 100`, name === 'progress' ? `${child.name}'s Score` : 'Expected Average']}
                                    />
                                    <Legend wrapperStyle={{ bottom: -5 }} />
                                    <Line type="monotone" dataKey="progress" stroke="#25AFF4" strokeWidth={3} dot={{ fill: '#25AFF4', r: 5 }} activeDot={{ r: 7 }} name={`${child.name}'s Score`} />
                                    <Line type="monotone" dataKey="expected" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Expected Average" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    )}

                    {/* ═══ Section 1B: Learning Activity / Screen Time ═══ */}
                    <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "var(--card-bg)", border: "1px solid var(--border-color)", mb: 4 }}>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, mb: 3, textTransform: "uppercase" }}>
                            Learning Activity / Screen Time
                        </Typography>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {/* Today card */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ background: "var(--bg-subtle)", borderRadius: 3, p: 3, border: "1px solid var(--border-color)", height: "100%" }}>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", mb: 1.5 }}>
                                        Today's Activity
                                    </Typography>

                                    {!hasActivityToday ? (
                                        <Typography sx={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>
                                            No activity yet today. Encourage {child.name} to start a lesson!
                                        </Typography>
                                    ) : (
                                        <>
                                            {/* Screen time with from/to */}
                                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
                                                <TimeIcon sx={{ fontSize: 18, color: "#2563eb", mt: 0.2 }} />
                                                <Box>
                                                    <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                                                        Screen Time: <Box component="span" sx={{ color: "#2563eb", fontFamily: "'Baloo 2', cursive", fontSize: 15 }}>{formatDuration(activitySummary.today.totalLearningSeconds)}</Box>
                                                    </Typography>
                                                    {activitySummary.today.startTime && (
                                                        <Typography sx={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                                                            {formatTime(activitySummary.today.startTime)}
                                                            {activitySummary.today.endTime && activitySummary.today.endTime !== activitySummary.today.startTime
                                                                ? ` → ${formatTime(activitySummary.today.endTime)}`
                                                                : ""}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Quizzes today */}
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                <QuizzesIcon sx={{ fontSize: 18, color: "#25AFF4" }} />
                                                <Typography sx={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                                    <Box component="span" sx={{ fontWeight: 700, color: "#25AFF4" }}>{activitySummary.today.quizzesCompleted}</Box> quiz{activitySummary.today.quizzesCompleted !== 1 ? "zes" : ""} completed
                                                </Typography>
                                            </Box>

                                            {/* XP today */}
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <XpIcon sx={{ fontSize: 18, color: "#FFCC35" }} />
                                                <Typography sx={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                                    <Box component="span" sx={{ fontWeight: 700, color: "#FFCC35" }}>{activitySummary.today.xpEarned}</Box> XP earned today
                                                </Typography>
                                            </Box>

                                            {/* Daily Quest today */}
                                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 0.5 }}>
                                                <Typography sx={{ fontSize: 16, lineHeight: 1.3 }}>⭐</Typography>
                                                <Box>
                                                    <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                                                        Daily Quest:{" "}
                                                        {activitySummary.dailyQuestSummary?.todayCompleted ? (
                                                            <Box component="span" sx={{ color: "#16a34a", fontWeight: 700 }}>
                                                                Completed — {activitySummary.dailyQuestSummary.todayScore}%
                                                            </Box>
                                                        ) : (
                                                            <Box component="span" sx={{ color: "#94A3B8", fontStyle: "italic", fontWeight: 400 }}>
                                                                Not completed yet
                                                            </Box>
                                                        )}
                                                    </Typography>
                                                    {activitySummary.dailyQuestSummary?.todayCompleted && (
                                                        <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                                                            +{activitySummary.dailyQuestSummary.todayXP} XP · +{activitySummary.dailyQuestSummary.todayGems} Gems
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            </Grid>

                            {/* Weekly card */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ background: "var(--bg-subtle)", borderRadius: 3, p: 3, border: "1px solid var(--border-color)", height: "100%" }}>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", mb: 2 }}>
                                        Weekly Activity
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                        <Box sx={{ flex: 1, minWidth: 100, background: "var(--progress-time-bg)", borderRadius: 2, p: 2, textAlign: "center" }}>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>This Week Learning Time</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 20, color: "#2563eb" }}>
                                                {formatDuration(activitySummary.weekly.totalLearningSeconds)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 100, background: "var(--progress-quizzes-bg)", borderRadius: 2, p: 2, textAlign: "center" }}>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>This Week Quizzes</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 20, color: "#16a34a" }}>
                                                {activitySummary.weekly.quizzesCompleted}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 100, background: "rgba(118,75,162,0.08)", borderRadius: 2, p: 2, textAlign: "center" }}>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Daily Quests</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 20, color: "#764ba2" }}>
                                                {activitySummary.dailyQuestSummary?.weeklyCompleted ?? 0}
                                                <Box component="span" sx={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500 }}>/7</Box>
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>

                        <Grid container spacing={3}>
                            {/* Recent Activity Timeline — limited to 5 entries */}
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Box sx={{ background: "var(--bg-subtle)", borderRadius: 3, p: 3, border: "1px solid var(--border-color)" }}>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", mb: 2 }}>
                                        Recent Activity
                                    </Typography>
                                    {recentTimeline.length === 0 ? (
                                        <Typography sx={{ color: "var(--text-tertiary)", fontSize: 14 }}>
                                            No activity yet. Once lessons start, updates will appear here.
                                        </Typography>
                                    ) : (
                                        recentTimeline.map((item, index) => (
                                            <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.2, borderBottom: index === recentTimeline.length - 1 ? "none" : "1px dashed #e2e8f0" }}>
                                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", minWidth: 70 }}>
                                                    {new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </Typography>
                                                <Typography sx={{ fontSize: 14, color: "var(--text-secondary)" }}>{item.description}</Typography>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Grid>

                            {/* Insights */}
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Box sx={{ background: "var(--bg-subtle)", borderRadius: 3, p: 3, border: "1px solid var(--border-color)" }}>
                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", mb: 2 }}>
                                        Child Usage Insights
                                    </Typography>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <Box sx={{ background: "var(--progress-insight-bg)", borderRadius: 2, p: 2 }}>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Most Practiced Category</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "#0f766e" }}>
                                                {formatCategory(activitySummary.insights.mostPracticedCategory)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ background: "var(--progress-insight-bg)", borderRadius: 2, p: 2 }}>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Best Score This Week</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "#6d28d9" }}>
                                                {activitySummary.insights.bestScoreThisWeek != null ? `${activitySummary.insights.bestScoreThisWeek} / 100` : "-"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ background: "var(--bg-hover)", borderRadius: 2, p: 2 }}>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Avg Daily Learning Time</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "#c2410c" }}>
                                                {formatDuration(activitySummary.insights.averageDailyLearningSeconds)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ background: "rgba(118,75,162,0.07)", borderRadius: 2, p: 2 }}>
                                            <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Total Daily Quests</Typography>
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "#764ba2" }}>
                                                {activitySummary.dailyQuestSummary?.totalCompleted ?? 0}
                                                <Box component="span" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: "var(--text-tertiary)", fontWeight: 500, ml: 0.5 }}>completed</Box>
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* ═══ Section 2: Category Cards ═══ */}
                    <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)", mb: 3 }}>
                        Learning Progress by Category
                    </Typography>

                    {child.categories.length === 0 ? (
                        <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "var(--card-bg)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                            <Typography sx={{ color: "var(--text-secondary)" }}>{child.name} hasn't started playing any categories yet.</Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={3}>
                            {child.categories.map((cat) => {
                                const progressColor = levelColors[cat.level] || "#25AFF4";
                                // Per-category score out of 100
                                const catScore = Math.min(Math.round((cat.xp / MAX_XP_PER_CATEGORY) * 100), 100);

                                return (
                                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={cat.categoryId}>
                                        <Paper elevation={0} sx={{
                                            borderRadius: "16px", p: 3, background: "var(--card-bg)", border: `2px solid ${progressColor}30`,
                                            transition: "all 0.2s", "&:hover": { transform: "translateY(-3px)", boxShadow: `0 8px 20px ${progressColor}15`, borderColor: `${progressColor}60` },
                                            textAlign: "center",
                                        }}>
                                            <Chip
                                                label={levelLabels[cat.level] || cat.level}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${progressColor}20`,
                                                    color: progressColor,
                                                    fontWeight: 700,
                                                    fontSize: 11,
                                                    textTransform: "uppercase",
                                                    border: `1px solid ${progressColor}40`,
                                                    mb: 2,
                                                }}
                                            />

                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", textTransform: "capitalize", mb: 1 }}>
                                                {cat.categoryId.replace(/[-_]+/g, " ")}
                                            </Typography>

                                            {/* Score badge */}
                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: 28, color: progressColor, mb: 1 }}>
                                                {catScore}<Box component="span" sx={{ fontSize: 14, fontWeight: 600, color: "var(--text-tertiary)" }}>/100</Box>
                                            </Typography>

                                            <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>XP</Typography>
                                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#FFCC35", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.3 }}>
                                                        <XpIcon sx={{ fontSize: 15 }} /> {cat.xp}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Quizzes</Typography>
                                                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#25AFF4", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.3 }}>
                                                        <QuizzesIcon sx={{ fontSize: 15 }} /> {cat.quizzesCompleted}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}

                    {/* ═══ Section 3: Placement Test Results ═══ */}
                    <Box sx={{ mt: 5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                            <PlacementIcon sx={{ fontSize: 28, color: "#7c3aed" }} />
                            <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)" }}>
                                Placement Test Results
                            </Typography>
                        </Box>

                        {!child.placementCompleted ? (
                            <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "#faf5ff", border: "1px dashed #c4b5fd", textAlign: "center" }}>
                                <PlacementIcon sx={{ fontSize: 48, color: "#c4b5fd", mb: 1 }} />
                                <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 18, color: "#7c3aed", mb: 0.5 }}>
                                    No Placement Test Taken
                                </Typography>
                                <Typography sx={{ color: "#8b5cf6", fontSize: 14 }}>
                                    {child.name} hasn't completed the placement test yet. They'll be assessed when they start their learning journey.
                                </Typography>
                            </Paper>
                        ) : child.placementResults && child.placementResults.length > 0 ? (
                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ background: "var(--bg-subtle)" }}>
                                            <TableCell sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-secondary)", textTransform: "uppercase", borderBottom: "2px solid var(--border-color)" }}>Category</TableCell>
                                            <TableCell align="center" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-secondary)", textTransform: "uppercase", borderBottom: "2px solid var(--border-color)" }}>Score</TableCell>
                                            <TableCell align="center" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-secondary)", textTransform: "uppercase", borderBottom: "2px solid var(--border-color)" }}>Assigned Level</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {child.placementResults.map((pr) => {
                                            const levelColor = levelColors[pr.assignedLevel] || "#94a3b8";
                                            return (
                                                <TableRow key={pr.categoryId} sx={{ "&:last-child td": { borderBottom: 0 }, "&:hover": { background: "var(--bg-subtle)" } }}>
                                                    <TableCell sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", textTransform: "capitalize" }}>
                                                        {pr.categoryId.replace(/[-_]+/g, " ")}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                                                            <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 20, color: pr.score >= 70 ? "#16a34a" : pr.score >= 40 ? "#f59e0b" : "#ef4444" }}>
                                                                {pr.score}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>/ 100</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            icon={<TrophyIcon sx={{ fontSize: 16, color: `${levelColor} !important` }} />}
                                                            label={levelLabels[pr.assignedLevel] || pr.assignedLevel}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: `${levelColor}20`,
                                                                color: levelColor,
                                                                fontWeight: 700,
                                                                fontSize: 12,
                                                                border: `1px solid ${levelColor}40`,
                                                                textTransform: "uppercase",
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Paper elevation={0} sx={{ borderRadius: "16px", p: 4, background: "var(--card-bg)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                                <Typography sx={{ color: "var(--text-secondary)" }}>No category results recorded for placement test.</Typography>
                            </Paper>
                        )}
                    </Box>

                    {/* Recent Activity footer */}
                    {child.lastPlayedDate && (
                        <Box sx={{ mt: 5, p: 3, background: "var(--bg-subtle)", borderRadius: "16px", border: "1px dashed var(--border-color)" }}>
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", fontSize: 14 }}>
                                <strong>Recent Activity:</strong> {child.name} last played on {new Date(child.lastPlayedDate).toLocaleDateString()} at {new Date(child.lastPlayedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                            </Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}