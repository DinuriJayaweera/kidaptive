import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Box, Typography, Paper, Avatar, Switch, TextField, CircularProgress,
    Alert, Snackbar, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, IconButton, MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import {
    CameraAlt as CameraIcon, Person as PersonIcon, Palette as PaletteIcon,
    Notifications as NotifIcon, Visibility as MonitorIcon, Lock as LockIcon,
    Assessment as ReportIcon, Tune as PrefIcon, DeleteForever as DeleteIcon,
    Save as SaveIcon, RestartAlt as ResetIcon, Download as DownloadIcon,
    CheckCircle as CheckIcon, Close as CloseIcon,
} from "@mui/icons-material";
import {
    getParentProfile, updateParentProfile, uploadParentAvatar,
    changeParentPassword, deleteParentAccount, getParentChildrenEnriched,
} from "../api/parentApi";
import type { ParentProfile, EnhancedChildProfile } from "../api/parentApi";
import { useAuth } from "../../auth/context/AuthContext";
import "../styles/parentSettings.css";

const DEFAULTS: Partial<ParentProfile> = {
    themePreference: "light",
    notificationSettings: { emailNotifications: true, learningReminders: true, progressReports: true, weeklyDigest: false },
    monitoringSettings: { trackScreenTime: true, dailyLimitMinutes: 60, contentFiltering: true, activityAlerts: false },
    timezone: "UTC", dateFormat: "MM/DD/YYYY",
};

const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Kolkata", "Australia/Sydney"];
const DATE_FORMATS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];

// ── PDF colour helpers ──────────────────────────────────────────────────────
const BRAND_BLUE: [number, number, number] = [37, 175, 244];
const BRAND_GREEN: [number, number, number] = [142, 232, 112];
const BRAND_YELLOW: [number, number, number] = [255, 204, 53];
const LEVEL_COLORS: Record<string, [number, number, number]> = {
    starter: BRAND_YELLOW,
    explorer: BRAND_BLUE,
    champion: BRAND_GREEN,
};
const LEVEL_LABELS: Record<string, string> = {
    starter: "Starter",
    explorer: "Explorer",
    champion: "Champion",
};
const MAX_XP_PER_CATEGORY = 150;

function computeOverallScore(child: EnhancedChildProfile): number {
    if (!child.categories || child.categories.length === 0) return 0;
    const totalEarned = child.categories.reduce((sum, c) => sum + Math.min(c.xp || 0, MAX_XP_PER_CATEGORY), 0);
    const totalPossible = child.categories.length * MAX_XP_PER_CATEGORY;
    return Math.round((totalEarned / totalPossible) * 100);
}

function computeOverallLevel(score: number): string {
    return score >= 75 ? "champion" : score >= 40 ? "explorer" : "starter";
}

export default function ParentSettingsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, setUser, user } = useAuth();
    const securityRef = useRef<HTMLDivElement>(null);

    const [profile, setProfile] = useState<ParentProfile | null>(null);
    const [children, setChildren] = useState<EnhancedChildProfile[]>([]);
    const [draft, setDraft] = useState<Partial<ParentProfile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
    const [dirty, setDirty] = useState(false);

    // Password
    const [pwdDialog, setPwdDialog] = useState(false);
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState("");

    // Delete
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    // PDF
    const [pdfLoading, setPdfLoading] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getParentProfile(), getParentChildrenEnriched()])
            .then(([p, c]) => { setProfile(p); setDraft(p); setChildren(c); })
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load settings."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if ((location.state as any)?.scrollTo === "security" && securityRef.current) {
            setTimeout(() => securityRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
        }
    }, [location.state, loading]);

    // Apply theme globally
    useEffect(() => {
        const pref = (draft.themePreference || profile?.themePreference || "light");
        const isDark = pref === "dark";
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        localStorage.setItem("kidaptive-theme", isDark ? "dark" : "light");
    }, [draft.themePreference, profile?.themePreference]);

    const updateDraft = useCallback((partial: Partial<ParentProfile>) => {
        setDraft(prev => ({ ...prev, ...partial }));
        setDirty(true);
    }, []);

    const handleSave = async () => {
        if (!dirty || !profile) return;
        setSaving(true);
        try {
            let finalAvatarUrl = draft.avatarUrl;
            if (draft.avatarUrl?.startsWith("data:image")) {
                const avatarRes = await uploadParentAvatar(draft.avatarUrl);
                finalAvatarUrl = avatarRes.avatarUrl;
                setDraft(prev => ({ ...prev, avatarUrl: finalAvatarUrl }));
            }

            const payload: any = {};
            if (draft.name !== profile.name) payload.name = draft.name;
            if (draft.phone !== profile.phone) payload.phone = draft.phone;
            if (draft.themePreference !== profile.themePreference) payload.themePreference = draft.themePreference;
            if (JSON.stringify(draft.notificationSettings) !== JSON.stringify(profile.notificationSettings))
                payload.notificationSettings = draft.notificationSettings;
            if (JSON.stringify(draft.monitoringSettings) !== JSON.stringify(profile.monitoringSettings))
                payload.monitoringSettings = draft.monitoringSettings;
            if (draft.timezone !== profile.timezone) payload.timezone = draft.timezone;
            if (draft.dateFormat !== profile.dateFormat) payload.dateFormat = draft.dateFormat;

            const res = await updateParentProfile(payload);
            const finalProfile = { ...res.profile, avatarUrl: finalAvatarUrl || profile.avatarUrl };
            setProfile(finalProfile);
            setDraft(finalProfile);
            setDirty(false);

            if (user) {
                const updatedUser = { ...user, name: payload.name || user.name, avatar: finalAvatarUrl || user.avatar };
                setUser(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }

            setToast({ msg: "Settings saved successfully!", severity: "success" });
        } catch (err: any) {
            setToast({ msg: err.response?.data?.message ?? "Failed to save settings.", severity: "error" });
        } finally { setSaving(false); }
    };

    const handleReset = () => {
        if (!profile) return;
        setDraft({ ...profile, ...DEFAULTS, notificationSettings: { ...DEFAULTS.notificationSettings! }, monitoringSettings: { ...DEFAULTS.monitoringSettings! } });
        setDirty(true);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { setToast({ msg: "Image must be under 2MB", severity: "error" }); return; }
        const reader = new FileReader();
        reader.onload = () => {
            setDraft(prev => ({ ...prev, avatarUrl: reader.result as string }));
            setDirty(true);
        };
        reader.readAsDataURL(file);
    };

    const handleChangePassword = async () => {
        setPwdError("");
        if (!newPwd || !currentPwd) { setPwdError("All fields required"); return; }
        if (newPwd !== confirmPwd) { setPwdError("Passwords don't match"); return; }
        if (newPwd.length < 8) { setPwdError("Min 8 characters"); return; }
        setPwdLoading(true);
        try {
            await changeParentPassword({ currentPassword: currentPwd, newPassword: newPwd });
            setPwdDialog(false);
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
            setToast({ msg: "Password changed! Please log in again.", severity: "success" });
            setTimeout(() => { logout(); navigate("/auth/login", { replace: true }); }, 2000);
        } catch (err: any) {
            setPwdError(err.response?.data?.message ?? "Failed to change password");
        } finally { setPwdLoading(false); }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== "DELETE") return;
        setDeleteLoading(true);
        try {
            await deleteParentAccount("DELETE");
            logout();
            navigate("/", { replace: true });
        } catch (err: any) {
            setToast({ msg: err.response?.data?.message ?? "Failed to delete account.", severity: "error" });
        } finally { setDeleteLoading(false); }
    };

    // ── PDF Generation: one PDF, each child gets its own section / page ─────
    const generatePDF = async (type: "weekly" | "monthly") => {
        setPdfLoading(type);
        try {
            const { default: jsPDF } = await import("jspdf");
            const now = new Date();
            const title = type === "weekly" ? "Weekly Learning Report" : "Monthly Learning Report";

            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageW = 210;
            const pageH = 297;
            const margin = 14;
            const contentW = pageW - margin * 2;

            // ── Helpers ──────────────────────────────────────────────────────
            const ensureSpace = (needed: number, currentY: number): number => {
                if (currentY + needed > pageH - 20) {
                    doc.addPage();
                    addPageHeader();
                    return 30;
                }
                return currentY;
            };

            const addPageHeader = () => {
                doc.setFillColor(...BRAND_BLUE);
                doc.rect(0, 0, pageW, 14, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.text("KIDAPTIVE  —  " + title.toUpperCase(), margin, 9);
                doc.text(now.toLocaleDateString(), pageW - margin, 9, { align: "right" });
            };

            const drawSectionBar = (y: number, text: string, rgb: [number, number, number]) => {
                doc.setFillColor(...rgb);
                doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.text(text, margin + 3, y + 5.5);
                return y + 12;
            };

            const drawKV = (y: number, label: string, value: string, labelColor: [number, number, number] = [100, 116, 139]): number => {
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...labelColor);
                doc.text(label + ":", margin + 4, y);
                doc.setTextColor(17, 24, 39);
                doc.setFont("helvetica", "bold");
                doc.text(value, margin + 55, y);
                return y + 6;
            };

            const drawProgressBar = (y: number, percent: number, color: [number, number, number]): number => {
                const barW = contentW - 8;
                const barH = 5;
                // Background
                doc.setFillColor(226, 232, 240);
                doc.roundedRect(margin + 4, y, barW, barH, 2, 2, "F");
                // Fill
                const fillW = Math.max(2, (percent / 100) * barW);
                doc.setFillColor(...color);
                doc.roundedRect(margin + 4, y, fillW, barH, 2, 2, "F");
                // Label
                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...color);
                doc.text(`${percent} / 100`, margin + 4 + barW + 2, y + 4, { align: "left" });
                return y + 9;
            };

            // ── Cover page ───────────────────────────────────────────────────
            // Big header
            doc.setFillColor(...BRAND_BLUE);
            doc.rect(0, 0, pageW, 55, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont("helvetica", "bold");
            doc.text("Kidaptive", margin, 22);
            doc.setFontSize(14);
            doc.setFont("helvetica", "normal");
            doc.text(title, margin, 33);
            doc.setFontSize(9);
            doc.text(`Generated: ${now.toLocaleDateString()}`, margin, 43);
            doc.text(`Parent: ${profile?.name || ""}`, margin, 50);

            // Summary box
            let y = 65;
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(margin, y, contentW, 28, 4, 4, "F");
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(17, 24, 39);
            doc.text(`Children in this report: ${children.length}`, margin + 4, y + 8);
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            if (children.length === 0) {
                doc.text("No children have been added yet.", margin + 4, y + 16);
            } else {
                children.forEach((child, idx) => {
                    doc.text(`${idx + 1}. ${child.name}  (Age ${child.age})`, margin + 4, y + 16 + idx * 6);
                });
            }
            y += 34;

            if (children.length === 0) {
                doc.setFontSize(12);
                doc.setTextColor(100, 116, 139);
                doc.text("No children have been added yet.", margin, y + 20);
            }

            // ── One section per child ─────────────────────────────────────────
            for (let ci = 0; ci < children.length; ci++) {
                const child = children[ci];

                // Each child starts on a fresh page (except if we're still on cover with space)
                if (ci === 0 && y < 200) {
                    // still on cover — add a divider
                    doc.setDrawColor(226, 232, 240);
                    doc.line(margin, y + 2, pageW - margin, y + 2);
                    y += 8;
                } else {
                    doc.addPage();
                    addPageHeader();
                    y = 22;
                }

                const overallScore = computeOverallScore(child);
                const overallLevel = computeOverallLevel(overallScore);
                const levelColor = LEVEL_COLORS[overallLevel] || BRAND_BLUE;
                const totalQuizzes = child.categories.reduce((sum, c) => sum + (c.quizzesCompleted || 0), 0);

                // Child name bar
                doc.setFillColor(30, 30, 50);
                doc.roundedRect(margin, y, contentW, 12, 3, 3, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text(`${child.name}  (Age ${child.age})`, margin + 4, y + 8);
                // Overall score badge on right
                doc.setFillColor(...levelColor);
                doc.roundedRect(pageW - margin - 40, y + 2, 38, 8, 2, 2, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.text(`${LEVEL_LABELS[overallLevel]}  ${overallScore}/100`, pageW - margin - 39, y + 7.5);
                y += 17;

                // Overall English score
                y = ensureSpace(30, y);
                y = drawSectionBar(y, "Overall English Progress", BRAND_BLUE);
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139);
                doc.text(`Score out of 100 — average across ${child.categories.length} ${child.categories.length === 1 ? "category" : "categories"}`, margin + 4, y);
                y += 6;
                y = drawProgressBar(y, overallScore, levelColor);

                // Key stats row
                y = ensureSpace(20, y);
                const statsY = y;
                const col = contentW / 3;
                // XP box
                doc.setFillColor(239, 246, 255);
                doc.roundedRect(margin, statsY, col - 2, 14, 2, 2, "F");
                doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
                doc.text("Total XP", margin + 2, statsY + 5);
                doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...BRAND_BLUE);
                doc.text(String(child.totalXP || 0), margin + 2, statsY + 12);
                // Gems box
                doc.setFillColor(255, 251, 235);
                doc.roundedRect(margin + col, statsY, col - 2, 14, 2, 2, "F");
                doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
                doc.text("Gems", margin + col + 2, statsY + 5);
                doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(180, 130, 0);
                doc.text(String(child.gems || 0), margin + col + 2, statsY + 12);
                // Streak box
                doc.setFillColor(255, 247, 237);
                doc.roundedRect(margin + col * 2, statsY, col - 2, 14, 2, 2, "F");
                doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
                doc.text("Streak", margin + col * 2 + 2, statsY + 5);
                doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(217, 119, 6);
                doc.text(`${child.streak || 0} days`, margin + col * 2 + 2, statsY + 12);
                y = statsY + 18;

                // More key stats
                y = ensureSpace(16, y);
                y = drawKV(y, "Total Quizzes Completed", String(totalQuizzes));
                y = drawKV(y, "Last Active", child.lastPlayedDate ? new Date(child.lastPlayedDate).toLocaleDateString() : "Never");
                y = drawKV(y, "Member Since", new Date(child.createdAt).toLocaleDateString());
                y += 2;

                // Category performance
                if (child.categories.length > 0) {
                    y = ensureSpace(14, y);
                    y = drawSectionBar(y, "Category Performance", BRAND_GREEN);

                    // Table header
                    y = ensureSpace(8, y);
                    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
                    doc.text("Category", margin + 4, y);
                    doc.text("Level", margin + 70, y);
                    doc.text("Score", margin + 100, y);
                    doc.text("XP", margin + 125, y);
                    doc.text("Quizzes", margin + 150, y);
                    y += 5;

                    // Divider
                    doc.setDrawColor(226, 232, 240);
                    doc.line(margin, y, pageW - margin, y);
                    y += 3;

                    for (const cat of child.categories) {
                        y = ensureSpace(8, y);
                        const catScore = Math.min(Math.round(((cat.xp || 0) / MAX_XP_PER_CATEGORY) * 100), 100);
                        const catLevel = cat.level || "starter";
                        const catLevelColor = LEVEL_COLORS[catLevel] || BRAND_BLUE;
                        const catName = (cat.categoryId || "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

                        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
                        doc.text(catName, margin + 4, y);

                        // Level badge
                        doc.setFillColor(...catLevelColor);
                        doc.roundedRect(margin + 66, y - 4, 28, 6, 1.5, 1.5, "F");
                        doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
                        doc.text(LEVEL_LABELS[catLevel] || catLevel, margin + 67, y + 0.5);

                        doc.setTextColor(17, 24, 39); doc.setFontSize(9); doc.setFont("helvetica", "bold");
                        doc.text(`${catScore}/100`, margin + 100, y);
                        doc.setFont("helvetica", "normal");
                        doc.text(String(cat.xp || 0), margin + 125, y);
                        doc.text(String(cat.quizzesCompleted || 0), margin + 150, y);

                        y += 7;
                        doc.setDrawColor(241, 245, 249);
                        doc.line(margin, y - 2, pageW - margin, y - 2);
                    }
                    y += 3;
                }

                // Placement test results
                if (child.placementCompleted && child.placementResults && child.placementResults.length > 0) {
                    y = ensureSpace(14, y);
                    y = drawSectionBar(y, "Placement Test Results", [124, 58, 237]);

                    y = ensureSpace(8, y);
                    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
                    doc.text("Category", margin + 4, y);
                    doc.text("Score", margin + 100, y);
                    doc.text("Assigned Level", margin + 130, y);
                    y += 5;
                    doc.setDrawColor(226, 232, 240);
                    doc.line(margin, y, pageW - margin, y);
                    y += 3;

                    for (const pr of child.placementResults) {
                        y = ensureSpace(8, y);
                        const prName = (pr.categoryId || "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                        const prLevelColor = LEVEL_COLORS[pr.assignedLevel] || BRAND_BLUE;

                        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
                        doc.text(prName, margin + 4, y);

                        const scoreColor: [number, number, number] = pr.score >= 70 ? [22, 163, 74] : pr.score >= 40 ? [245, 158, 11] : [239, 68, 68];
                        doc.setTextColor(...scoreColor); doc.setFont("helvetica", "bold");
                        doc.text(`${pr.score}/100`, margin + 100, y);

                        doc.setFillColor(...prLevelColor);
                        doc.roundedRect(margin + 128, y - 4, 32, 6, 1.5, 1.5, "F");
                        doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
                        doc.text(LEVEL_LABELS[pr.assignedLevel] || pr.assignedLevel, margin + 129, y + 0.5);

                        y += 7;
                        doc.setDrawColor(241, 245, 249);
                        doc.line(margin, y - 2, pageW - margin, y - 2);
                    }
                }

                y += 4;
            }

            // ── Footer on every page ─────────────────────────────────────────
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFillColor(248, 250, 252);
                doc.rect(0, pageH - 12, pageW, 12, "F");
                doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(156, 163, 175);
                doc.text(`Kidaptive Learning Report  •  ${title}  •  ${now.toLocaleDateString()}`, pageW / 2, pageH - 5, { align: "center" });
                doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 5, { align: "right" });
            }

            doc.save(`kidaptive-${type}-report-${now.toISOString().slice(0, 10)}.pdf`);
            setToast({ msg: `${title} downloaded!`, severity: "success" });
        } catch (err) {
            console.error("PDF generation error:", err);
            setToast({ msg: "Failed to generate report. Please try again.", severity: "error" });
        } finally { setPdfLoading(null); }
    };

    if (loading) return <Box className="ps-loading"><CircularProgress /><Typography sx={{ mt: 2, color: "#6b7280" }}>Loading settings…</Typography></Box>;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!profile || !draft) return null;

    const initials = profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const ns = draft.notificationSettings || profile.notificationSettings;
    const ms = draft.monitoringSettings || profile.monitoringSettings;

    return (
        <Box className="ps-container">
            <Box className="ps-page-header">
                <Typography variant="h5" className="ps-page-title">Settings</Typography>
                <Typography className="ps-page-subtitle">Manage your account, appearance, and preferences</Typography>
            </Box>


            <Grid container spacing={3}>
                {/* LEFT COLUMN */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    {/* 1. Account Settings */}
                    <Paper elevation={0} className="ps-section">
                        <Box className="ps-section-header">
                            <PersonIcon className="ps-section-icon" />
                            <Typography className="ps-section-title">Account Settings</Typography>
                        </Box>
                        <Box className="ps-avatar-area">
                            <Box className="ps-avatar-wrap">
                                <Avatar src={draft.avatarUrl || undefined} sx={{ width: 80, height: 80, fontSize: 30, fontFamily: "'Baloo 2', cursive", fontWeight: 700, bgcolor: draft.avatarUrl ? "transparent" : "#25AFF4" }}>
                                    {!draft.avatarUrl && initials}
                                </Avatar>
                                <label className="ps-avatar-upload">
                                    <CameraIcon sx={{ fontSize: 18 }} />
                                    <input type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
                                </label>
                            </Box>
                            <Typography className="ps-avatar-hint">Click camera to change avatar (max 2MB)</Typography>
                        </Box>
                        <Box className="ps-fields">
                            <TextField label="Full Name" fullWidth size="small" value={draft.name || ""} onChange={e => updateDraft({ name: e.target.value })} className="ps-field" />
                            <TextField label="Phone" fullWidth size="small" value={draft.phone || ""} onChange={e => updateDraft({ phone: e.target.value })} placeholder="e.g. +1 555 0123" className="ps-field" />
                            <TextField label="Email" fullWidth size="small" value={profile.email} disabled className="ps-field" helperText="Email cannot be changed" />
                        </Box>
                    </Paper>

                    {/* 2. Appearance */}
                    <Paper elevation={0} className="ps-section">
                        <Box className="ps-section-header">
                            <PaletteIcon className="ps-section-icon" />
                            <Typography className="ps-section-title">Appearance</Typography>
                        </Box>
                        <Box className="ps-toggle-row">
                            <Box><Typography className="ps-toggle-label">Dark Mode</Typography><Typography className="ps-toggle-desc">Use dark theme for the dashboard</Typography></Box>
                            <Switch checked={draft.themePreference === "dark"} onChange={(_, c) => updateDraft({ themePreference: c ? "dark" : "light" })} color="primary" />
                        </Box>
                    </Paper>

                    {/* 3. Notifications */}
                    <Paper elevation={0} className="ps-section">
                        <Box className="ps-section-header">
                            <NotifIcon className="ps-section-icon" />
                            <Typography className="ps-section-title">Notifications</Typography>
                        </Box>
                        <Box className="ps-toggle-row">
                            <Box><Typography className="ps-toggle-label">Enable Notifications</Typography><Typography className="ps-toggle-desc">Receive important updates and learning reminders</Typography></Box>
                            <Switch checked={ns.emailNotifications} onChange={(_, c) => updateDraft({ notificationSettings: { ...ns, emailNotifications: c, learningReminders: c, progressReports: c, weeklyDigest: c } })} color="primary" />
                        </Box>
                    </Paper>

                    {/* 4. Child Monitoring */}
                    <Paper elevation={0} className="ps-section">
                        <Box className="ps-section-header">
                            <MonitorIcon className="ps-section-icon" />
                            <Typography className="ps-section-title">Child Monitoring</Typography>
                        </Box>
                        <Box className="ps-toggle-row">
                            <Box><Typography className="ps-toggle-label">Enable Child Monitoring</Typography><Typography className="ps-toggle-desc">Track and limit learning activity and screen time</Typography></Box>
                            <Switch checked={ms.trackScreenTime as boolean} onChange={(_, c) => updateDraft({ monitoringSettings: { ...ms, trackScreenTime: c, contentFiltering: c, activityAlerts: c } })} color="primary" />
                        </Box>
                        {ms.trackScreenTime && (
                            <Box className="ps-toggle-row">
                                <Box><Typography className="ps-toggle-label">Daily Limit (minutes)</Typography><Typography className="ps-toggle-desc">Max learning time per day</Typography></Box>
                                <TextField type="number" size="small" value={ms.dailyLimitMinutes} onChange={e => updateDraft({ monitoringSettings: { ...ms, dailyLimitMinutes: Math.max(0, parseInt(e.target.value) || 0) } })} sx={{ width: 90 }} inputProps={{ min: 0, max: 480 }} />
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* RIGHT COLUMN */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    {/* 5. Security */}
                    <Paper elevation={0} className="ps-section" ref={securityRef}>
                        <Box className="ps-section-header">
                            <LockIcon className="ps-section-icon" />
                            <Typography className="ps-section-title">Security</Typography>
                        </Box>
                        <Box className="ps-security-actions">
                            <button className="ps-btn ps-btn-outline" onClick={() => setPwdDialog(true)}>
                                <LockIcon sx={{ fontSize: 18 }} /> Change Password
                            </button>
                        </Box>
                    </Paper>

                    {/* 6. Learning Reports */}
                    <Paper elevation={0} className="ps-section">
                        <Box className="ps-section-header">
                            <ReportIcon className="ps-section-icon" />
                            <Typography className="ps-section-title">Learning Reports</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, color: "var(--text-tertiary)", mb: 2 }}>
                            {children.length === 0
                                ? "No children added yet. Add a child to generate reports."
                                : children.length === 1
                                    ? `Generates a PDF report for ${children[0].name}.`
                                    : `Generates a single PDF with separate sections for all ${children.length} children.`
                            }
                        </Typography>
                        <Box className="ps-report-cards">
                            <Box className="ps-report-card" onClick={() => !pdfLoading && generatePDF("weekly")}>
                                <Box className="ps-report-icon ps-icon-blue">
                                    {pdfLoading === "weekly" ? <CircularProgress size={22} /> : <DownloadIcon sx={{ color: "#25AFF4" }} />}
                                </Box>
                                <Box>
                                    <Typography className="ps-report-title">Weekly Report</Typography>
                                    <Typography className="ps-report-desc">XP, gems, streak & progress</Typography>
                                </Box>
                            </Box>
                            <Box className="ps-report-card" onClick={() => !pdfLoading && generatePDF("monthly")}>
                                <Box className="ps-report-icon ps-icon-green">
                                    {pdfLoading === "monthly" ? <CircularProgress size={22} /> : <DownloadIcon sx={{ color: "#8EE870" }} />}
                                </Box>
                                <Box>
                                    <Typography className="ps-report-title">Monthly Report</Typography>
                                    <Typography className="ps-report-desc">Full activity summary & categories</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>

                    {/* 7. Account Preferences */}
                    <Paper elevation={0} className="ps-section">
                        <Box className="ps-section-header">
                            <PrefIcon className="ps-section-icon" />
                            <Typography className="ps-section-title">Account Preferences</Typography>
                        </Box>
                        <Box className="ps-fields">
                            <FormControl fullWidth size="small" className="ps-field">
                                <InputLabel>Timezone</InputLabel>
                                <Select value={draft.timezone || "UTC"} label="Timezone" onChange={e => updateDraft({ timezone: e.target.value })}>
                                    {TIMEZONES.map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small" className="ps-field">
                                <InputLabel>Date Format</InputLabel>
                                <Select value={draft.dateFormat || "MM/DD/YYYY"} label="Date Format" onChange={e => updateDraft({ dateFormat: e.target.value })}>
                                    {DATE_FORMATS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Paper>

                    {/* 8. Danger Zone */}
                    <Paper elevation={0} className="ps-section ps-danger-zone">
                        <Box className="ps-section-header">
                            <DeleteIcon className="ps-section-icon ps-danger-icon" />
                            <Typography className="ps-section-title ps-danger-title">Danger Zone</Typography>
                        </Box>
                        <Typography className="ps-danger-desc">Permanently delete your account and all associated data including children profiles. This action cannot be undone.</Typography>
                        <button className="ps-btn ps-btn-danger" onClick={() => setDeleteDialog(true)}>
                            <DeleteIcon sx={{ fontSize: 18 }} /> Delete Account
                        </button>
                    </Paper>
                </Grid>
            </Grid>

            {/* Save bar */}
            <Box className="ps-save-bar" sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <button className="ps-btn ps-btn-reset" onClick={handleReset} disabled={saving}>
                    <ResetIcon sx={{ fontSize: 18 }} /> Reset to Defaults
                </button>
                <button className={`ps-btn ps-btn-save ${!dirty ? "ps-btn-disabled" : ""}`} onClick={handleSave} disabled={!dirty || saving}>
                    {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <SaveIcon sx={{ fontSize: 18 }} />}
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </Box>

            {/* Dialogs */}
            <Dialog open={pwdDialog} onClose={() => setPwdDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700 }}>
                    Change Password
                    <IconButton onClick={() => setPwdDialog(false)} sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: "16px !important" }}>
                    {pwdError && <Alert severity="error" sx={{ mb: 2 }}>{pwdError}</Alert>}
                    <TextField label="Current Password" type="password" fullWidth sx={{ mb: 2 }} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1, mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#25AFF4', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => navigate("/auth/forgot-password")}>
                            Forgot Password?
                        </Typography>
                    </Box>
                    <TextField label="New Password" type="password" fullWidth sx={{ mb: 2 }} value={newPwd} onChange={e => setNewPwd(e.target.value)} helperText="Min 8 chars, 1 uppercase, 1 number, 1 special" />
                    <TextField label="Confirm New Password" type="password" fullWidth value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPwdDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleChangePassword} disabled={pwdLoading} sx={{ bgcolor: "#25AFF4" }}>
                        {pwdLoading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Change Password"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "#ef4444" }}>
                    Delete Account
                </DialogTitle>
                <DialogContent sx={{ pt: "16px !important" }}>
                    <Alert severity="error" sx={{ mb: 2 }}>This will permanently delete your account, all children, and their learning data.</Alert>
                    <Typography sx={{ mb: 2, fontSize: 14 }}>Type <strong>DELETE</strong> to confirm:</Typography>
                    <TextField fullWidth value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => { setDeleteDialog(false); setDeleteConfirm(""); }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteAccount} disabled={deleteConfirm !== "DELETE" || deleteLoading}>
                        {deleteLoading ? <CircularProgress size={20} /> : "Permanently Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Toast */}
            <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={() => setToast(null)} severity={toast?.severity} variant="filled" icon={toast?.severity === "success" ? <CheckIcon /> : undefined} sx={{ borderRadius: "12px" }}>
                    {toast?.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}