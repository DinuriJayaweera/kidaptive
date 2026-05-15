import { Box, Typography, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { getDashboardData } from "../services/quizApi";
import { getAchievements, type Achievement } from "../services/achievementsApi";
import ChildSidebar from "../components/ChildSidebar";
import TopBarStats from "../components/TopBarStats";
import AvatarBuilderStation from "../components/AvatarBuilderStation";
import api from "../../../services/apiClient";
import streakImg from "../../../assets/streak.png";
import gemsImg from "../../../assets/gems.png";
import xpsImg from "../../../assets/xps.png";
import starImg from "../../../assets/star.png";
import crownImg from "../../../assets/crown.png";

// ── Stat Pill Component ────────────────────────────────────────────────────
function StatPill({
    icon,
    value,
    label,
    color,
    bg,
}: {
    icon: string;
    value: string | number;
    label: string;
    color: string;
    bg: string;
}) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                borderRadius: "20px",
                px: { xs: 2, sm: 3 },
                py: 2.5,
                backgroundColor: bg,
                flex: 1,
                minWidth: { xs: 90, sm: 110 },
                transition: "transform 0.2s ease",
                "&:hover": { transform: "translateY(-3px)" },
            }}
        >
            <Box
                component="img"
                src={icon}
                alt={label}
                sx={{ width: 36, height: 36, objectFit: "contain" }}
            />
            <Typography
                sx={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 800,
                    fontSize: { xs: "1.4rem", sm: "1.6rem" },
                    color,
                    lineHeight: 1,
                }}
            >
                {value}
            </Typography>
            <Typography
                sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}

// ── Achievement Badge ──────────────────────────────────────────────────────
// Now driven by the real Achievement object from the backend. Shows the
// emoji icon, dims locked items, and overlays a tiny progress bar when
// the locked achievement is multi-step.
function AchievementBadge({ a }: { a: Achievement }) {
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
                gap: 0.6,
                p: 1.5,
                borderRadius: "16px",
                backgroundColor: a.unlocked ? "rgba(255,193,7,0.10)" : "rgba(0,0,0,0.03)",
                border: a.unlocked ? "2px solid #FFD700" : "2px solid #E2E8F0",
                opacity: a.unlocked ? 1 : 0.6,
                transition: "all 0.2s ease",
                cursor: "default",
                minHeight: 130,
                "&:hover": a.unlocked
                    ? { transform: "scale(1.05)", boxShadow: "0 4px 16px rgba(255,193,7,0.25)" }
                    : {},
            }}
        >
            <Box
                sx={{
                    fontSize: "1.8rem",
                    filter: a.unlocked ? "none" : "grayscale(100%)",
                    lineHeight: 1,
                }}
            >
                {a.icon}
            </Box>
            <Typography
                sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: a.unlocked ? "#1A202C" : "#9CA3AF",
                    textAlign: "center",
                    lineHeight: 1.2,
                }}
            >
                {a.title}
            </Typography>
            {showProgress ? (
                <Box sx={{ width: "100%", mt: "auto" }}>
                    <Box
                        sx={{
                            width: "100%",
                            height: 4,
                            backgroundColor: "rgba(0,0,0,0.08)",
                            borderRadius: 4,
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #25AFF4, #1d96d4)",
                                transition: "width 0.4s ease",
                            }}
                        />
                    </Box>
                    <Typography
                        sx={{
                            mt: 0.3,
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "0.62rem",
                            color: "#94A3B8",
                            textAlign: "center",
                        }}
                    >
                        {a.progress.current} / {a.progress.target}
                    </Typography>
                </Box>
            ) : (
                <Typography
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "0.62rem",
                        color: "#94A3B8",
                        textAlign: "center",
                        lineHeight: 1.2,
                    }}
                >
                    {a.unlocked ? "Earned!" : a.description}
                </Typography>
            )}
        </Box>
    );
}

// ── XP Progress Bar ────────────────────────────────────────────────────────
function XpLevelBar({ totalXp }: { totalXp: number }) {
    // Simple leveling: every 500 XP = 1 level
    const level = Math.floor(totalXp / 500) + 1;
    const xpInLevel = totalXp % 500;
    const pct = (xpInLevel / 500) * 100;

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: "#25AFF4",
                    }}
                >
                    Level {level}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "0.72rem",
                        color: "#94A3B8",
                    }}
                >
                    {xpInLevel} / 500 XP
                </Typography>
            </Box>
            <Box
                sx={{
                    width: "100%",
                    height: 10,
                    backgroundColor: "rgba(37,175,244,0.12)",
                    borderRadius: 10,
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #25AFF4, #1d96d4)",
                        borderRadius: 10,
                        transition: "width 1s ease",
                    }}
                />
            </Box>
        </Box>
    );
}

// ── Main ChildProfilePage ──────────────────────────────────────────────────
export default function ChildProfilePage() {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    const [dashboardData, setDashboardData] = useState<{
        stats: { totalXp: number; streak: number; gems: number };
        categories: any[];
    } | null>(null);
    // Live achievement list (locked + unlocked) — used for the profile preview.
    // Full list is shown on the dedicated /child/achievements page.
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [avatarBuilderOpen, setAvatarBuilderOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({
        open: false,
        msg: "",
        severity: "success",
    });

    useEffect(() => {
        // Fetch dashboard + achievements in parallel — both are independent
        // and the page can render the achievement card as soon as it lands.
        Promise.all([getDashboardData(), getAchievements()])
            .then(([dash, ach]) => {
                setDashboardData(dash);
                setAchievements(ach.achievements);
            })
            .catch((err) => console.error("Profile load failed:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSaveAvatar = useCallback(
        async (newAvatar: string) => {
            setSaving(true);
            try {
                await api.patch("/child/profile/avatar", { avatar: newAvatar });
                // Update local auth user so avatar reflects immediately
                if (user) {
                    setUser({ ...user, avatar: newAvatar });
                }
                setAvatarBuilderOpen(false);
                setSnack({ open: true, msg: "Avatar updated! 🎉", severity: "success" });
            } catch {
                setSnack({ open: true, msg: "Oops! Could not save avatar.", severity: "error" });
            } finally {
                setSaving(false);
            }
        },
        [user, setUser]
    );

    if (loading || !dashboardData) {
        return (
            <Box
                sx={{
                    display: "flex",
                    minHeight: "100vh",
                    backgroundColor: "#F4F8FB",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress sx={{ color: "#25AFF4" }} />
            </Box>
        );
    }

    const { totalXp, streak, gems } = dashboardData.stats;
    const categoriesCount = dashboardData.categories.length;
    const displayName = user?.name ?? "Learner";
    const currentAvatar = user?.avatar ?? "🦊";
    const level = Math.floor(totalXp / 500) + 1;

    // Show up to 6 achievements on the profile preview, prioritising unlocked
    // ones first so the card always feels celebratory. Full list lives on
    // the /child/achievements page (linked below).
    const previewAchievements: Achievement[] = [
        ...achievements.filter((a) => a.unlocked),
        ...achievements.filter((a) => !a.unlocked),
    ].slice(0, 6);
    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    const totalCount = achievements.length;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#F4F8FB",
                display: "flex",
                overflow: "hidden",
            }}
        >
            {/* ── Left Sidebar ── */}
            <ChildSidebar activePage="PROFILE" />

            {/* ── Main Content ── */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: { xs: 2, sm: 3, md: 4 },
                    overflowY: "auto",
                    maxWidth: "100%",
                }}
            >
                {/* Top Bar */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mb: 3,
                    }}
                >
                    <TopBarStats totalXp={totalXp} streak={streak} gems={gems} />
                </Box>

                {/* Page Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        sx={{
                            fontFamily: "'Baloo 2', sans-serif",
                            fontWeight: 800,
                            fontSize: { xs: "1.8rem", sm: "2.2rem" },
                            color: "#1A202C",
                            lineHeight: 1.2,
                        }}
                    >
                        My Profile 🌟
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "0.95rem",
                            color: "#64748B",
                            mt: 0.5,
                        }}
                    >
                        Customize your avatar and see your amazing progress!
                    </Typography>
                </Box>

                {/* Main 2-column layout */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", lg: "row" },
                        gap: 3,
                        alignItems: "flex-start",
                    }}
                >
                    {/* ─ LEFT: Profile Card + Avatar Builder ─ */}
                    <Box
                        sx={{
                            width: { xs: "100%", lg: 340 },
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                        }}
                    >
                        {/* Profile Hero Card */}
                        <Box
                            sx={{
                                backgroundColor: "#fff",
                                borderRadius: "24px",
                                border: "2px solid #E8ECF1",
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2,
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            {/* Decorative background bubbles */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: -30,
                                    right: -30,
                                    width: 140,
                                    height: 140,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(37,175,244,0.06)",
                                    pointerEvents: "none",
                                }}
                            />
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: -20,
                                    left: -20,
                                    width: 100,
                                    height: 100,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(255,204,53,0.08)",
                                    pointerEvents: "none",
                                }}
                            />

                            {/* Level badge */}
                            <Box
                                sx={{
                                    backgroundColor: "rgba(37,175,244,0.12)",
                                    borderRadius: "30px",
                                    px: 2,
                                    py: 0.6,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.8,
                                }}
                            >
                                <Box component="img" src={crownImg} alt="level" sx={{ width: 18, height: 18 }} />
                                <Typography
                                    sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontWeight: 700,
                                        fontSize: "0.78rem",
                                        color: "#25AFF4",
                                    }}
                                >
                                    Level {level} Learner
                                </Typography>
                            </Box>

                            {/* Avatar display */}
                            <Box
                                onClick={() => setAvatarBuilderOpen(true)}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(37,175,244,0.1)",
                                    border: "4px solid #25AFF4",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "3.8rem",
                                    cursor: "pointer",
                                    transition: "all 0.25s ease",
                                    position: "relative",
                                    "&:hover": {
                                        transform: "scale(1.06)",
                                        boxShadow: "0 0 0 6px rgba(37,175,244,0.2)",
                                    },
                                    "&:hover .edit-overlay": {
                                        opacity: 1,
                                    },
                                }}
                            >
                                {currentAvatar.startsWith("data:") || currentAvatar.startsWith("http") ? (
                                    <Box
                                        component="img"
                                        src={currentAvatar}
                                        sx={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <span>{currentAvatar}</span>
                                )}
                                {/* Edit overlay */}
                                <Box
                                    className="edit-overlay"
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: "50%",
                                        backgroundColor: "rgba(37,175,244,0.45)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: 0,
                                        transition: "opacity 0.2s",
                                        fontSize: "1.5rem",
                                    }}
                                >
                                    ✏️
                                </Box>
                            </Box>

                            <Box sx={{ textAlign: "center" }}>
                                <Typography
                                    sx={{
                                        fontFamily: "'Baloo 2', sans-serif",
                                        fontWeight: 800,
                                        fontSize: "1.5rem",
                                        color: "#1A202C",
                                    }}
                                >
                                    {displayName}
                                </Typography>
                                {user?.username && (
                                    <Typography
                                        sx={{
                                            fontFamily: "'Poppins', sans-serif",
                                            fontSize: "0.82rem",
                                            color: "#94A3B8",
                                            mt: 0.2,
                                        }}
                                    >
                                        @{user.username}
                                    </Typography>
                                )}
                                {user?.age && (
                                    <Typography
                                        sx={{
                                            fontFamily: "'Poppins', sans-serif",
                                            fontSize: "0.82rem",
                                            color: "#64748B",
                                            mt: 0.2,
                                        }}
                                    >
                                        Age {user.age} 🎂
                                    </Typography>
                                )}
                            </Box>

                            {/* XP level bar */}
                            <Box sx={{ width: "100%", px: 1 }}>
                                <XpLevelBar totalXp={totalXp} />
                            </Box>

                            {/* Edit avatar button */}
                            <Box
                                onClick={() => setAvatarBuilderOpen(true)}
                                sx={{
                                    mt: 1,
                                    width: "100%",
                                    py: 1.3,
                                    borderRadius: "30px",
                                    border: "2.5px solid #25AFF4",
                                    backgroundColor: "rgba(37,175,244,0.07)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 1,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        backgroundColor: "rgba(37,175,244,0.15)",
                                        transform: "scale(1.02)",
                                    },
                                }}
                            >
                                <Typography sx={{ fontSize: "1.2rem" }}>🎨</Typography>
                                <Typography
                                    sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                        color: "#25AFF4",
                                    }}
                                >
                                    Change My Avatar
                                </Typography>
                            </Box>
                        </Box>

                        {/* Achievements Card */}
                        <Box
                            sx={{
                                backgroundColor: "#fff",
                                borderRadius: "24px",
                                border: "2px solid #E8ECF1",
                                p: 3,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 1.5,
                                    mb: 2.5,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Typography sx={{ fontSize: "1.4rem" }}>🏆</Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: "'Baloo 2', sans-serif",
                                            fontWeight: 800,
                                            fontSize: "1.1rem",
                                            color: "#1A202C",
                                        }}
                                    >
                                        My Achievements
                                    </Typography>
                                </Box>
                                {/* Tiny summary pill — gives kids a "X of Y" goal to chase */}
                                <Typography
                                    sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontWeight: 700,
                                        fontSize: "0.75rem",
                                        color: "#64748B",
                                        backgroundColor: "rgba(37,175,244,0.1)",
                                        px: 1.5,
                                        py: 0.4,
                                        borderRadius: "12px",
                                    }}
                                >
                                    {unlockedCount}/{totalCount}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 1.5,
                                }}
                            >
                                {previewAchievements.map((a) => (
                                    <AchievementBadge key={a.key} a={a} />
                                ))}
                            </Box>
                            {/* "View All" link to the dedicated achievements page */}
                            <Box
                                onClick={() => navigate("/child/achievements")}
                                sx={{
                                    mt: 2,
                                    py: 1,
                                    textAlign: "center",
                                    borderRadius: "12px",
                                    backgroundColor: "rgba(37,175,244,0.08)",
                                    cursor: "pointer",
                                    transition: "background-color 0.15s",
                                    "&:hover": {
                                        backgroundColor: "rgba(37,175,244,0.15)",
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        color: "#25AFF4",
                                    }}
                                >
                                    View All Achievements →
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* ─ RIGHT: Stats + Category Progress ─ */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                        {/* Stats Row */}
                        <Box
                            sx={{
                                backgroundColor: "#fff",
                                borderRadius: "24px",
                                border: "2px solid #E8ECF1",
                                p: 3,
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                                <Typography sx={{ fontSize: "1.4rem" }}>⚡</Typography>
                                <Typography
                                    sx={{
                                        fontFamily: "'Baloo 2', sans-serif",
                                        fontWeight: 800,
                                        fontSize: "1.1rem",
                                        color: "#1A202C",
                                    }}
                                >
                                    My Stats
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1.5,
                                }}
                            >
                                <StatPill
                                    icon={streakImg}
                                    value={streak}
                                    label="Day Streak"
                                    color="#FF9447"
                                    bg="rgba(255,148,71,0.1)"
                                />
                                <StatPill
                                    icon={xpsImg}
                                    value={`${totalXp}`}
                                    label="Total XP"
                                    color="#D4A000"
                                    bg="rgba(253,199,0,0.1)"
                                />
                                <StatPill
                                    icon={gemsImg}
                                    value={gems}
                                    label="Gems"
                                    color="#25AFF4"
                                    bg="rgba(37,175,244,0.1)"
                                />
                                <StatPill
                                    icon={starImg}
                                    value={categoriesCount}
                                    label="Categories"
                                    color="#8B5CF6"
                                    bg="rgba(139,92,246,0.1)"
                                />
                            </Box>
                        </Box>

                        {/* Category Progress Card */}
                        {dashboardData.categories.length > 0 && (
                            <Box
                                sx={{
                                    backgroundColor: "#fff",
                                    borderRadius: "24px",
                                    border: "2px solid #E8ECF1",
                                    p: 3,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                                    <Typography sx={{ fontSize: "1.4rem" }}>📚</Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: "'Baloo 2', sans-serif",
                                            fontWeight: 800,
                                            fontSize: "1.1rem",
                                            color: "#1A202C",
                                        }}
                                    >
                                        My Learning Progress 🚀🎯✨
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {dashboardData.categories.map((cat: any) => {
                                        const levelColors: Record<string, { color: string; bg: string; label: string }> = {
                                            Starter: { color: "#FFCC35", bg: "rgba(255,204,53,0.12)", label: "⭐ Starter" },
                                            Explorer: { color: "#25AFF4", bg: "rgba(37,175,244,0.12)", label: "🚀 Explorer" },
                                            Champion: { color: "#22C55E", bg: "rgba(34,197,94,0.12)", label: "🏆 Champion" },
                                        };
                                        const style = levelColors[cat.level] ?? levelColors["Starter"];
                                        const xp = cat.xp ?? 0;
                                        const xpMax = cat.xpToNextLevel ?? 100;
                                        const pct = Math.min((xp / xpMax) * 100, 100);

                                        return (
                                            <Box
                                                key={cat.id}
                                                onClick={() => navigate(`/child/category-progress/${cat.id}`)}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 2,
                                                    p: 2,
                                                    borderRadius: "16px",
                                                    backgroundColor: style.bg,
                                                    border: `1.5px solid ${style.color}33`,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    "&:hover": {
                                                        transform: "translateX(4px)",
                                                        boxShadow: `0 4px 16px ${style.color}22`,
                                                    },
                                                }}
                                            >
                                                <Typography sx={{ fontSize: "2rem", width: 36, textAlign: "center", flexShrink: 0 }}>
                                                    {{
                                                        "Alphabet": "🔤",
                                                        "Articles": "📰",
                                                        "Pronouns": "👤",
                                                        "Nouns": "🍎",
                                                        "Verbs": "🏃",
                                                        "Adjectives": "🎨",
                                                        "Adverbs": "⚡",
                                                        "Prepositions": "📦",
                                                        "Conjunctions": "🔗",
                                                        "Interjections": "😲"
                                                    }[cat.name as string] || "📘"}
                                                </Typography>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                                        <Typography
                                                            sx={{
                                                                fontFamily: "'Poppins', sans-serif",
                                                                fontWeight: 700,
                                                                fontSize: "0.88rem",
                                                                color: "#1A202C",
                                                            }}
                                                        >
                                                            {cat.name}
                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                fontFamily: "'Poppins', sans-serif",
                                                                fontWeight: 700,
                                                                fontSize: "0.72rem",
                                                                color: style.color,
                                                                whiteSpace: "nowrap",
                                                                ml: 1,
                                                            }}
                                                        >
                                                            {style.label}
                                                        </Typography>
                                                    </Box>
                                                    <Box
                                                        sx={{
                                                            width: "100%",
                                                            height: 8,
                                                            backgroundColor: "rgba(0,0,0,0.07)",
                                                            borderRadius: 10,
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: `${pct}%`,
                                                                height: "100%",
                                                                backgroundColor: style.color,
                                                                borderRadius: 10,
                                                                transition: "width 1s ease",
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: "'Poppins', sans-serif",
                                                            fontSize: "0.68rem",
                                                            color: "#94A3B8",
                                                            mt: 0.4,
                                                        }}
                                                    >
                                                        {xp} / {xpMax} XP · {cat.quizzesCompleted ?? 0} quizzes done
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        {/* Fun facts / motivation */}
                        <Box
                            sx={{
                                backgroundColor: "rgba(37,175,244,0.07)",
                                borderRadius: "24px",
                                border: "2px solid rgba(37,175,244,0.2)",
                                p: 3,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <Typography sx={{ fontSize: "2rem", flexShrink: 0 }}>💡</Typography>
                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily: "'Baloo 2', sans-serif",
                                        fontWeight: 800,
                                        fontSize: "1rem",
                                        color: "#1A202C",
                                        mb: 0.3,
                                    }}
                                >
                                    Keep it up, {displayName}!
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontSize: "0.84rem",
                                        color: "#64748B",
                                    }}
                                >
                                    You've earned {totalXp} XP so far! Every quiz makes you smarter. 🧠✨
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ── Avatar Builder Modal ── */}
            {avatarBuilderOpen && (
                <AvatarBuilderStation
                    currentAvatar={currentAvatar}
                    childName={displayName}
                    onSave={handleSaveAvatar}
                    onClose={() => setAvatarBuilderOpen(false)}
                    saving={saving}
                />
            )}

            {/* ── Snackbar ── */}
            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snack.severity} sx={{ borderRadius: "12px", fontFamily: "'Poppins', sans-serif" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}