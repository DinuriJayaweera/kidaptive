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

const TIMEZONES = ["UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","Europe/London","Europe/Paris","Asia/Tokyo","Asia/Kolkata","Australia/Sydney"];
const DATE_FORMATS = ["MM/DD/YYYY","DD/MM/YYYY","YYYY-MM-DD"];

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
    const [toast, setToast] = useState<{msg: string; severity: "success"|"error"} | null>(null);
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

    const generatePDF = async (type: "weekly" | "monthly") => {
        setPdfLoading(type);
        try {
            const { default: jsPDF } = await import("jspdf");
            const doc = new jsPDF();
            const now = new Date();
            const title = type === "weekly" ? "Weekly Learning Report" : "Monthly Learning Report";

            // Header
            doc.setFillColor(37, 175, 244);
            doc.rect(0, 0, 210, 40, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("Kidaptive", 15, 18);
            doc.setFontSize(14);
            doc.text(title, 15, 30);
            doc.setFontSize(9);
            doc.text(`Generated: ${now.toLocaleDateString()}`, 150, 18);
            doc.text(`Parent: ${profile?.name || ""}`, 150, 26);

            let y = 55;
            doc.setTextColor(30, 30, 30);

            if (children.length === 0) {
                doc.setFontSize(12);
                doc.text("No children added yet.", 15, y);
            } else {
                for (const child of children) {
                    if (y > 250) { doc.addPage(); y = 20; }
                    // Child header
                    doc.setFillColor(224, 242, 254);
                    doc.roundedRect(10, y - 5, 190, 12, 3, 3, "F");
                    doc.setFontSize(13);
                    doc.setTextColor(17, 24, 39);
                    doc.text(`${child.name} (Age ${child.age})`, 15, y + 3);
                    y += 18;

                    // Stats
                    doc.setFontSize(10);
                    doc.setTextColor(75, 85, 99);
                    const stats = [
                        ["Total XP", String(child.totalXP || 0)],
                        ["Gems", String(child.gems || 0)],
                        ["Streak", `${child.streak || 0} days`],
                        ["Last Active", child.lastPlayedDate ? new Date(child.lastPlayedDate).toLocaleDateString() : "Never"],
                    ];
                    for (const [label, val] of stats) {
                        doc.setTextColor(107, 114, 128);
                        doc.text(`${label}:`, 15, y);
                        doc.setTextColor(17, 24, 39);
                        doc.text(val, 60, y);
                        y += 7;
                    }
                    y += 3;

                    // Categories
                    if (child.categories.length > 0) {
                        doc.setFontSize(11);
                        doc.setTextColor(37, 175, 244);
                        doc.text("Category Performance", 15, y);
                        y += 7;
                        doc.setFontSize(9);
                        for (const cat of child.categories) {
                            doc.setTextColor(75, 85, 99);
                            const catName = cat.categoryId.charAt(0).toUpperCase() + cat.categoryId.slice(1);
                            doc.text(`${catName}  —  Level: ${cat.level}  |  XP: ${cat.xp}  |  Quizzes: ${cat.quizzesCompleted}`, 20, y);
                            y += 6;
                        }
                    }
                    y += 10;
                }
            }

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(156, 163, 175);
                doc.text(`Kidaptive Learning Report  •  Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
            }

            doc.save(`kidaptive-${type}-report-${now.toISOString().slice(0, 10)}.pdf`);
            setToast({ msg: `${title} downloaded!`, severity: "success" });
        } catch (err) {
            setToast({ msg: "Failed to generate report.", severity: "error" });
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

            {/* Save bar (Moved to bottom) */}
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
