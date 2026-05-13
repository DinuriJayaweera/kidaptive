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
    type AdminNotification,
} from "../api/adminNotificationsApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1)  return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)   return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1)   return "Yesterday";
    if (days < 7)     return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(notifications: AdminNotification[]) {
    const today     = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo   = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, AdminNotification[]> = {
        Today: [], Yesterday: [], "This Week": [], Older: [],
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

const TYPE_META: Record<string, { color: string; label: string }> = {
    new_parent:          { color: "#6366f1", label: "New Parent"   },
    new_child:           { color: "#0ea5e9", label: "New Child"    },
    placement_completed: { color: "#8b5cf6", label: "Placement"    },
    champion_reached:    { color: "#f59e0b", label: "Champion"     },
    question_bank_low:   { color: "#ef4444", label: "Low Stock"    },
    daily_quest_low:     { color: "#f97316", label: "Low Stock"    },
    high_activity:       { color: "#10b981", label: "Activity"     },
    system_error:        { color: "#dc2626", label: "Error"        },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
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
        window.dispatchEvent(new Event("admin-notifications-updated"));
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        window.dispatchEvent(new Event("admin-notifications-updated"));
    };

    const displayed   = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
    const unreadCount = notifications.filter((n) => !n.read).length;
    const groups      = groupByDate(displayed);

    return (
        <Box sx={{ fontFamily: "'Inter', sans-serif", maxWidth: 800, mx: "auto" }}>

            {/* ── Header ── */}
            <Box sx={{ mb: 3 }}>
                <Typography sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1.4rem", sm: "1.75rem" },
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                }}>
                    Notifications
                </Typography>
                <Typography sx={{ fontSize: 14, color: "var(--text-secondary)", mt: 0.5 }}>
                    Platform events, alerts, and admin activity
                </Typography>
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
                            borderRadius: "8px",
                            px: 2,
                            background: filter === tab ? "var(--accent, #6366f1)18" : "transparent",
                            color: filter === tab ? "var(--accent, #6366f1)" : "var(--text-secondary)",
                            border: filter === tab ? "1px solid var(--accent, #6366f1)40" : "1px solid transparent",
                            "&:hover": { background: "var(--accent, #6366f1)12" },
                        }}
                    >
                        {tab === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
                    </Button>
                ))}
            </Box>

            {/* ── Content ── */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress size={32} sx={{ color: "var(--accent, #6366f1)" }} />
                </Box>
            ) : displayed.length === 0 ? (
                <Paper elevation={0} sx={{
                    borderRadius: "12px", p: 6, textAlign: "center",
                    background: "var(--card-bg, #ffffff)",
                    border: "1px solid var(--border-color, #e8ecf1)",
                }}>
                    <EmptyBellIcon sx={{ fontSize: 48, color: "var(--text-secondary)", mb: 2, opacity: 0.5 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 18, color: "var(--text-secondary)", mb: 0.5 }}>
                        {filter === "unread" ? "All caught up!" : "No notifications yet"}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", opacity: 0.7 }}>
                        {filter === "unread"
                            ? "No unread notifications at the moment."
                            : "Platform events and alerts will appear here."}
                    </Typography>
                </Paper>
            ) : (
                Object.entries(groups).map(([label, items]) => {
                    if (items.length === 0) return null;
                    return (
                        <Box key={label} sx={{ mb: 3 }}>
                            <Typography sx={{
                                fontSize: 11, fontWeight: 700,
                                color: "var(--text-secondary)",
                                textTransform: "uppercase", letterSpacing: 1,
                                mb: 1.5, pl: 0.5, opacity: 0.7,
                            }}>
                                {label}
                            </Typography>
                            <Paper elevation={0} sx={{
                                borderRadius: "12px",
                                background: "var(--card-bg, #ffffff)",
                                border: "1px solid var(--border-color, #e8ecf1)",
                                overflow: "hidden",
                            }}>
                                {items.map((notif, idx) => {
                                    const meta = TYPE_META[notif.type] ?? { color: "#6366f1", label: notif.type };
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
                                                borderBottom: idx < items.length - 1 ? "1px solid var(--border-color, #e8ecf1)" : "none",
                                                borderLeft: notif.read ? "3px solid var(--border-color, #e2e8f0)" : "3px solid #22c55e",
                                                background: notif.read ? "transparent" : "#22c55e08",
                                                transition: "border-color 0.5s ease, background 0.5s ease",
                                                cursor: notif.read ? "default" : "pointer",
                                            }}
                                        >
                                            {/* Icon */}
                                            <Box sx={{
                                                width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
                                                background: `${meta.color}18`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 20, mt: 0.2,
                                            }}>
                                                {notif.icon}
                                            </Box>

                                            {/* Body */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.3 }}>
                                                    <Typography sx={{
                                                        fontWeight: notif.read ? 500 : 700,
                                                        fontSize: 14,
                                                        color: "var(--text-primary)",
                                                    }}>
                                                        {notif.title}
                                                    </Typography>
                                                    <Chip
                                                        label={meta.label}
                                                        size="small"
                                                        sx={{
                                                            height: 18, fontSize: 10, fontWeight: 700,
                                                            backgroundColor: `${meta.color}18`,
                                                            color: meta.color,
                                                            border: `1px solid ${meta.color}30`,
                                                        }}
                                                    />
                                                    {!notif.read && (
                                                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                                                    )}
                                                </Box>
                                                <Typography sx={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                                    {notif.message}
                                                </Typography>
                                                <Typography sx={{ fontSize: 11, color: "var(--text-secondary)", mt: 0.5, opacity: 0.6 }}>
                                                    {timeAgo(notif.createdAt)}
                                                </Typography>
                                            </Box>

                                            {/* Delete */}
                                            <Box sx={{ flexShrink: 0 }}>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(notif._id); }}
                                                        sx={{ color: "var(--text-secondary)", opacity: 0.5, "&:hover": { color: "#ef4444", opacity: 1, background: "#ef444415" } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 17 }} />
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
