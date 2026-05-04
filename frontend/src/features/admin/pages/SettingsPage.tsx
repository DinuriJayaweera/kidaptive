import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
    Box, Typography, Paper, Switch, TextField, CircularProgress,
    Alert, Snackbar, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, IconButton,
} from "@mui/material";
import {
    Person as PersonIcon,
    Palette as PaletteIcon,
    Lock as LockIcon,
    Save as SaveIcon,
    CheckCircle as CheckIcon,
    Close as CloseIcon,
    LightMode as LightIcon,
    DarkMode as DarkIcon,
} from "@mui/icons-material";
import {
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    type AdminProfile,
} from "../api/adminProfileApi";
import { useAuth } from "../../auth/context/AuthContext";
import { useAdminTheme } from "../context/AdminThemeContext";
import "../styles/adminSettings.css";

export default function SettingsPage() {
    const location = useLocation();
    const { setUser, user } = useAuth();
    const { mode, toggleTheme } = useAdminTheme();
    const securityRef = useRef<HTMLDivElement>(null);

    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dirty, setDirty] = useState(false);
    const [toast, setToast] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

    // Draft fields
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // Password dialog
    const [pwdDialog, setPwdDialog] = useState(false);
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState("");

    useEffect(() => {
        getAdminProfile()
            .then((p) => {
                setProfile(p);
                setName(p.name);
                setPhone(p.phone ?? "");
            })
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load settings."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if ((location.state as { scrollTo?: string })?.scrollTo === "security" && securityRef.current) {
            setTimeout(() => securityRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
        }
    }, [location.state, loading]);

    const updateField = useCallback((field: "name" | "phone", value: string) => {
        if (field === "name") setName(value);
        if (field === "phone") setPhone(value);
        setDirty(true);
    }, []);

    const handleSave = async () => {
        if (!dirty || !profile) return;
        setSaving(true);
        try {
            const updated = await updateAdminProfile({
                name,
                email: profile.email,
                phone: phone || undefined,
                themePreference: mode,
            });
            setProfile(updated);
            setDirty(false);
            if (user) setUser({ ...user, name: updated.name, email: updated.email });
            setToast({ msg: "Settings saved successfully!", severity: "success" });
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                "Failed to save settings.";
            setToast({ msg, severity: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPwdError("");
        if (!currentPwd || !newPwd) { setPwdError("All fields required"); return; }
        if (newPwd !== confirmPwd) { setPwdError("Passwords don't match"); return; }
        if (newPwd.length < 6) { setPwdError("Minimum 6 characters"); return; }
        setPwdLoading(true);
        try {
            await changeAdminPassword({ currentPassword: currentPwd, newPassword: newPwd });
            setPwdDialog(false);
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
            setToast({ msg: "Password changed successfully!", severity: "success" });
        } catch (err: unknown) {
            setPwdError(
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                "Failed to change password",
            );
        } finally {
            setPwdLoading(false);
        }
    };

    if (loading) {
        return (
            <Box className="aps-loading">
                <CircularProgress sx={{ color: "#25AFF4" }} />
                <Typography sx={{ mt: 2, color: "var(--text-secondary)" }}>Loading settings…</Typography>
            </Box>
        );
    }

    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!profile) return null;

    const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "A";

    return (
        <Box className="aps-container">
            <Box className="aps-page-header">
                <Typography variant="h5" className="aps-page-title">Settings</Typography>
                <Typography className="aps-page-subtitle">Manage your account and preferences</Typography>
            </Box>

            <Grid container spacing={3}>
                {/* LEFT COLUMN */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    {/* Account Settings */}
                    <Paper elevation={0} className="aps-section">
                        <Box className="aps-section-header">
                            <PersonIcon className="aps-section-icon" />
                            <Typography className="aps-section-title">Account Settings</Typography>
                        </Box>
                        <Box className="aps-avatar-area">
                            <Box className="aps-avatar-circle">{initials}</Box>
                            <Typography className="aps-avatar-hint">Admin account — initials avatar</Typography>
                        </Box>
                        <Box className="aps-fields">
                            <TextField
                                label="Full Name"
                                fullWidth
                                size="small"
                                value={name}
                                onChange={(e) => updateField("name", e.target.value)}
                                className="aps-field"
                                id="aps-name"
                                inputProps={{ name: "aps-name" }}
                            />
                            <TextField
                                label="Phone"
                                fullWidth
                                size="small"
                                value={phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                                placeholder="e.g. +1 555 0123"
                                className="aps-field"
                                id="aps-phone"
                                inputProps={{ name: "aps-phone" }}
                            />
                            <TextField
                                label="Email"
                                fullWidth
                                size="small"
                                value={profile.email}
                                disabled
                                className="aps-field"
                                id="aps-email"
                                inputProps={{ name: "aps-email" }}
                                helperText="Email cannot be changed from here"
                            />
                        </Box>
                    </Paper>

                    {/* Appearance */}
                    <Paper elevation={0} className="aps-section">
                        <Box className="aps-section-header">
                            <PaletteIcon className="aps-section-icon" />
                            <Typography className="aps-section-title">Appearance</Typography>
                        </Box>
                        <Box className="aps-toggle-row">
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                {mode === "dark" ? (
                                    <DarkIcon sx={{ color: "#25AFF4", fontSize: 20 }} />
                                ) : (
                                    <LightIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                                )}
                                <Box>
                                    <Typography className="aps-toggle-label">Dark Mode</Typography>
                                    <Typography className="aps-toggle-desc">Switch between light and dark theme</Typography>
                                </Box>
                            </Box>
                            <Switch
                                checked={mode === "dark"}
                                onChange={() => { toggleTheme(); setDirty(true); }}
                                color="primary"
                                inputProps={{ "aria-label": "Toggle dark mode" }}
                                sx={{
                                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#25AFF4" },
                                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#25AFF4" },
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* RIGHT COLUMN */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    {/* Security */}
                    <Paper elevation={0} className="aps-section" ref={securityRef}>
                        <Box className="aps-section-header">
                            <LockIcon className="aps-section-icon" />
                            <Typography className="aps-section-title">Security</Typography>
                        </Box>
                        <Box className="aps-security-actions">
                            <button className="aps-btn aps-btn-outline" onClick={() => setPwdDialog(true)}>
                                <LockIcon sx={{ fontSize: 18 }} /> Change Password
                            </button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Save bar */}
            <Box className="aps-save-bar" sx={{ mt: 4 }}>
                <button
                    className={`aps-btn aps-btn-save${!dirty ? " aps-btn-disabled" : ""}`}
                    onClick={handleSave}
                    disabled={!dirty || saving}
                >
                    {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <SaveIcon sx={{ fontSize: 18 }} />}
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </Box>

            {/* Change Password Dialog */}
            <Dialog open={pwdDialog} onClose={() => setPwdDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700 }}>
                    Change Password
                    <IconButton onClick={() => setPwdDialog(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: "16px !important" }}>
                    {pwdError && <Alert severity="error" sx={{ mb: 2 }}>{pwdError}</Alert>}
                    <TextField
                        label="Current Password"
                        type="password"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        id="aps-dlg-current"
                        inputProps={{ name: "aps-dlg-current" }}
                    />
                    <TextField
                        label="New Password"
                        type="password"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        helperText="Minimum 6 characters"
                        id="aps-dlg-new"
                        inputProps={{ name: "aps-dlg-new" }}
                    />
                    <TextField
                        label="Confirm New Password"
                        type="password"
                        fullWidth
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        id="aps-dlg-confirm"
                        inputProps={{ name: "aps-dlg-confirm" }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPwdDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={pwdLoading}
                        sx={{ bgcolor: "#25AFF4", "&:hover": { bgcolor: "#0fa8ef" } }}
                    >
                        {pwdLoading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Change Password"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Toast */}
            <Snackbar
                open={!!toast}
                autoHideDuration={4000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setToast(null)}
                    severity={toast?.severity}
                    variant="filled"
                    icon={toast?.severity === "success" ? <CheckIcon /> : undefined}
                    sx={{ borderRadius: "12px" }}
                >
                    {toast?.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
