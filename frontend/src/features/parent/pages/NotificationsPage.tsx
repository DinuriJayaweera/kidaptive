import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Button, Chip, CircularProgress, IconButton, Tooltip,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    NotificationsNone as EmptyBellIcon,
} from "@mui/icons-material";
import {
    getNotifications,
    markRead,
    deleteNotification,
    type ParentNotification,
} from "../api/notificationsApi";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1)  return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)   return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1)   return "Yesterday";
    if (days < 7)     return `${days} days ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(notifications: ParentNotification[]) {
    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo   = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, ParentNotification[]> = {
        Today: [],
        Yesterday: [],
        "This Week": [],
        Older: [],
    };

    for (const n of notifications) {
        const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
        if (d >= today)          groups["Today"].push(n);
        else if (d >= yesterday) groups["Yesterday"].push(n);
        else if (d >= weekAgo)   groups["This Week"].push(n);
        else                     groups["Older"].push(n);
    }

    return groups;
}

const TYPE_COLORS: Record<string, string> = {
    level_up:         "#25AFF4",
    champion:         "#FFCC35",
    achievement:      "#7c3aed",
    daily_quest:      "#667eea",
    streak_milestone: "#f97316",
    gems_milestone:   "#0d9488",
    inactive:         "#94a3b8",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<ParentNotification[]>([]);
    const [loading, setLoading]             = useState(true);
    const [filter, setFilter]               = useState<"all" | "unread">("all");

    const load = useCallback(async () => {
        try {
            const { notifications: data } = await getNotifications();
            setNotifications(data);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleMarkRead = async (id: string) => {
        await markRead(id);
        setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
        window.dispatchEvent(new Event("notifications-updated"));
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        window.dispatchEvent(new Event("notifications-updated"));
    };

    const displayed   = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
    const unreadCount = notifications.filter((n) => !n.read).length;
    const groups      = groupByDate(displayed);

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif", maxWidth: 760, mx: "auto" }}>

            {/* ── Page header ── */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem" }, color: "var(--text-primary)", lineHeight: 1.2 }}>
                        Notifications
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: "var(--text-secondary)", mt: 0.5 }}>
                        Stay updated on your children's learning progress
                    </Typography>
                </Box>
            </Box>

            {/* ── Filter tabs ── */}
            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                {(["all", "unread"] as const).map((tab) => (
                    <Button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        size="small"
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: 13,
                            borderRadius: 2,
                            px: 2,
                            background: filter === tab ? "#25AFF420" : "transparent",
                            color: filter === tab ? "#25AFF4" : "var(--text-secondary)",
                            border: filter === tab ? "1px solid #25AFF440" : "1px solid transparent",
                            "&:hover": { background: "#25AFF415" },
                        }}
                    >
                        {tab === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
                    </Button>
                ))}
            </Box>

            {/* ── Content ── */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress sx={{ color: "#25AFF4" }} />
                </Box>
            ) : displayed.length === 0 ? (
                <Paper elevation={0} sx={{ borderRadius: "16px", p: 6, textAlign: "center", background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                    <EmptyBellIcon sx={{ fontSize: 56, color: "var(--text-tertiary)", mb: 2 }} />
                    <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 20, color: "var(--text-secondary)", mb: 0.5 }}>
                        {filter === "unread" ? "All caught up!" : "No notifications yet"}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: "var(--text-tertiary)" }}>
                        {filter === "unread"
                            ? "You have no unread notifications."
                            : "Notifications will appear here as your children learn and achieve milestones."}
                    </Typography>
                </Paper>
            ) : (
                Object.entries(groups).map(([label, items]) => {
                    if (items.length === 0) return null;
                    return (
                        <Box key={label} sx={{ mb: 3 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 1, mb: 1.5, pl: 0.5 }}>
                                {label}
                            </Typography>
                            <Paper elevation={0} sx={{ borderRadius: "16px", background: "var(--card-bg)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                                {items.map((notif, idx) => {
                                    const accent = TYPE_COLORS[notif.type] ?? "#25AFF4";
                                    return (
                                        <Box
                                            key={notif._id}
                                            onClick={() => { if (!notif.read) handleMarkRead(notif._id); }}
                                            sx={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 2,
                                                px: 3,
                                                py: 2.5,
                                                borderBottom: idx < items.length - 1 ? "1px solid var(--border-color)" : "none",
                                                borderLeft: notif.read
                                                    ? "3px solid #d1d5db"
                                                    : "3px solid #22c55e",
                                                background: notif.read ? "transparent" : "#22c55e08",
                                                transition: "border-color 0.5s ease, background 0.5s ease",
                                                cursor: notif.read ? "default" : "pointer",
                                            }}
                                        >
                                            {/* Icon */}
                                            <Box sx={{
                                                width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
                                                background: `${accent}18`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 22, mt: 0.2,
                                            }}>
                                                {notif.icon}
                                            </Box>

                                            {/* Body */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.3 }}>
                                                    <Typography sx={{ fontWeight: notif.read ? 600 : 700, fontSize: 14, color: "var(--text-primary)" }}>
                                                        {notif.title}
                                                    </Typography>
                                                    <Chip
                                                        label={notif.childName}
                                                        size="small"
                                                        sx={{ height: 18, fontSize: 10, fontWeight: 700, backgroundColor: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
                                                    />
                                                    {!notif.read && (
                                                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                                                    )}
                                                </Box>
                                                <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                                    {notif.message}
                                                </Typography>
                                                <Typography sx={{ fontSize: 11, color: "var(--text-tertiary)", mt: 0.5 }}>
                                                    {timeAgo(notif.createdAt)}
                                                </Typography>
                                            </Box>

                                            {/* Actions */}
                                            <Box sx={{ display: "flex", flexShrink: 0 }}>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={() => handleDelete(notif._id)} sx={{ color: "var(--text-tertiary)", "&:hover": { color: "#ef4444", background: "#ef444415" } }}>
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Paper>
                        </Box>
                    );
                })
            )}
        </Box>
    );
}
