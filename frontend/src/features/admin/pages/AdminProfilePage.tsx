import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Typography, Paper, Chip, CircularProgress, Alert, Grid,
} from "@mui/material";
import {
    Verified as VerifiedIcon,
    Settings as SettingsIcon,
    Lock as LockIcon,
    CalendarMonth as CalendarIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { getAdminProfile, type AdminProfile } from "../api/adminProfileApi";
import "../styles/adminProfile.css";

export default function AdminProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getAdminProfile()
            .then(setProfile)
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load profile."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box className="ap-loading">
                <CircularProgress sx={{ color: "#25AFF4" }} />
                <Typography sx={{ mt: 2, color: "var(--text-secondary)" }}>Loading profile…</Typography>
            </Box>
        );
    }

    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    if (!profile) return null;

    const initials = profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const memberDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <Box className="ap-container">
            <Box className="ap-page-header">
                <Typography variant="h5" className="ap-page-title">My Profile</Typography>
                <Typography className="ap-page-subtitle">Your admin account overview</Typography>
            </Box>

            {/* Hero Card */}
            <Paper elevation={0} className="ap-hero-card">
                <Box className="ap-hero-bg" />
                <Box className="ap-hero-content">
                    <Box className="ap-avatar-circle">{initials}</Box>
                    <Box className="ap-hero-info">
                        <Box className="ap-hero-name-row">
                            <Typography className="ap-hero-name">{profile.name}</Typography>
                            <Chip
                                icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
                                label="Administrator"
                                size="small"
                                sx={{
                                    bgcolor: "#dcfce7",
                                    color: "#16a34a",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    borderRadius: "100px",
                                    height: 26,
                                }}
                            />
                        </Box>
                        <Typography className="ap-hero-email">{profile.email}</Typography>
                        <Typography className="ap-hero-meta">
                            <CalendarIcon sx={{ fontSize: 15 }} />
                            Member since {memberDate}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Info Cards */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Contact Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} className="ap-info-card">
                        <Typography className="ap-card-title">
                            <PersonIcon className="ap-card-icon" /> Contact Information
                        </Typography>
                        <Box className="ap-info-rows">
                            <Box className="ap-info-row">
                                <Box className="ap-info-icon-wrap ap-icon-blue">
                                    <EmailIcon sx={{ fontSize: 18, color: "#25AFF4" }} />
                                </Box>
                                <Box>
                                    <Typography className="ap-info-label">Email</Typography>
                                    <Typography className="ap-info-value">{profile.email}</Typography>
                                </Box>
                            </Box>
                            <Box className="ap-info-row">
                                <Box className="ap-info-icon-wrap ap-icon-yellow">
                                    <PhoneIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
                                </Box>
                                <Box>
                                    <Typography className="ap-info-label">Phone</Typography>
                                    <Typography className="ap-info-value">
                                        {profile.phone || "Not provided"}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Account Details */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} className="ap-info-card">
                        <Typography className="ap-card-title">
                            <AdminIcon className="ap-card-icon" /> Account Details
                        </Typography>
                        <Box className="ap-info-rows">
                            <Box className="ap-info-row">
                                <Box className="ap-info-icon-wrap ap-icon-blue">
                                    <AdminIcon sx={{ fontSize: 18, color: "#25AFF4" }} />
                                </Box>
                                <Box>
                                    <Typography className="ap-info-label">Role</Typography>
                                    <Typography className="ap-info-value">Administrator</Typography>
                                </Box>
                            </Box>
                            <Box className="ap-info-row">
                                <Box className="ap-info-icon-wrap ap-icon-blue">
                                    <CalendarIcon sx={{ fontSize: 18, color: "#25AFF4" }} />
                                </Box>
                                <Box>
                                    <Typography className="ap-info-label">Member Since</Typography>
                                    <Typography className="ap-info-value">{memberDate}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box className="ap-actions">
                <button className="ap-btn ap-btn-primary" onClick={() => navigate("/admin/settings")}>
                    <SettingsIcon sx={{ fontSize: 20 }} />
                    Manage Settings
                </button>
                <button
                    className="ap-btn ap-btn-secondary"
                    onClick={() => navigate("/admin/settings", { state: { scrollTo: "security" } })}
                >
                    <LockIcon sx={{ fontSize: 20 }} />
                    Change Password
                </button>
            </Box>
        </Box>
    );
}
