import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
    Grid,
} from "@mui/material";
import {
    Verified as VerifiedIcon,
    Settings as SettingsIcon,
    Lock as LockIcon,
    ChildCare as ChildIcon,
    CalendarMonth as CalendarIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
} from "@mui/icons-material";
import { getParentProfile } from "../api/parentApi";
import type { ParentProfile } from "../api/parentApi";
import "../styles/parentProfile.css";

export default function ParentProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ParentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getParentProfile()
            .then(setProfile)
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load profile."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box className="pp-loading">
                <CircularProgress />
                <Typography sx={{ mt: 2, color: "#6b7280" }}>Loading profile…</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    }

    if (!profile) return null;

    const initials = profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const memberDate = new Date(profile.memberSince).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <Box className="pp-container">
            {/* Page title */}
            <Box className="pp-page-header">
                <Typography variant="h5" className="pp-page-title">
                    My Profile
                </Typography>
                <Typography className="pp-page-subtitle">
                    Your account overview and identity details
                </Typography>
            </Box>

            {/* Profile Hero Card */}
            <Paper elevation={0} className="pp-hero-card">
                <Box className="pp-hero-bg" />
                <Box className="pp-hero-content">
                    <Avatar
                        src={profile.avatarUrl || undefined}
                        className="pp-avatar"
                        sx={{
                            width: 100,
                            height: 100,
                            fontSize: 36,
                            fontFamily: "'Baloo 2', cursive",
                            fontWeight: 700,
                            bgcolor: profile.avatarUrl ? "transparent" : "#25AFF4",
                        }}
                    >
                        {!profile.avatarUrl && initials}
                    </Avatar>
                    <Box className="pp-hero-info">
                        <Box className="pp-hero-name-row">
                            <Typography className="pp-hero-name">{profile.name}</Typography>
                            {profile.emailVerified && (
                                <Chip
                                    icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                                    label="Verified"
                                    size="small"
                                    className="pp-verified-chip"
                                />
                            )}
                        </Box>
                        <Typography className="pp-hero-email">{profile.email}</Typography>
                        <Typography className="pp-hero-member">
                            <CalendarIcon sx={{ fontSize: 15, mr: 0.5, verticalAlign: "text-bottom" }} />
                            Member since {memberDate}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Info Cards Grid */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Contact Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} className="pp-info-card">
                        <Typography className="pp-card-title">
                            <PersonIcon className="pp-card-icon" /> Contact Information
                        </Typography>
                        <Box className="pp-info-rows">
                            <Box className="pp-info-row">
                                <Box className="pp-info-icon-wrap pp-icon-blue">
                                    <EmailIcon sx={{ fontSize: 18, color: "#25AFF4" }} />
                                </Box>
                                <Box>
                                    <Typography className="pp-info-label">Email</Typography>
                                    <Typography className="pp-info-value">{profile.email}</Typography>
                                </Box>
                            </Box>
                            <Box className="pp-info-row">
                                <Box className="pp-info-icon-wrap pp-icon-yellow">
                                    <PhoneIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
                                </Box>
                                <Box>
                                    <Typography className="pp-info-label">Phone</Typography>
                                    <Typography className="pp-info-value">
                                        {profile.phone || "Not provided"}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Quick Insights */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} className="pp-info-card">
                        <Typography className="pp-card-title">
                            <ChildIcon className="pp-card-icon" /> Quick Insights
                        </Typography>
                        <Box className="pp-insights-grid">
                            <Box className="pp-insight-item">
                                <Box className="pp-insight-number">{profile.childCount}</Box>
                                <Typography className="pp-insight-label">
                                    {profile.childCount === 1 ? "Child" : "Children"}
                                </Typography>
                            </Box>
                            <Box className="pp-insight-item">
                                <Box className="pp-insight-number pp-insight-verified">
                                    {profile.emailVerified ? "✓" : "✗"}
                                </Box>
                                <Typography className="pp-insight-label">Email Status</Typography>
                            </Box>
                            <Box className="pp-insight-item">
                                <Box className="pp-insight-number pp-insight-provider">
                                    {profile.authProvider === "google" ? "G" : "E"}
                                </Box>
                                <Typography className="pp-insight-label">
                                    {profile.authProvider === "google" ? "Google" : "Email Login"}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box className="pp-actions">
                <button
                    className="pp-btn pp-btn-primary"
                    onClick={() => navigate("/parent/settings")}
                >
                    <SettingsIcon sx={{ fontSize: 20 }} />
                    Manage Profile & Settings
                </button>
                <button
                    className="pp-btn pp-btn-secondary"
                    onClick={() => navigate("/parent/settings", { state: { scrollTo: "security" } })}
                >
                    <LockIcon sx={{ fontSize: 20 }} />
                    Change Password
                </button>
            </Box>
        </Box>
    );
}
