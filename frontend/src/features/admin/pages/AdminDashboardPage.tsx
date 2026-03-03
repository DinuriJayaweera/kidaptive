import { Box, Typography, Grid, Paper, Avatar, Divider } from "@mui/material";
import {
    People as PeopleIcon,
    AdminPanelSettings as AdminIcon,
    School as SchoolIcon,
    Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "../../auth/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { logout as apiLogout } from "../../auth/api/authApi";
import PillButton from "../../../components/ui/PillButton";

const statCards = [
    { label: "Total Users", icon: <PeopleIcon sx={{ fontSize: 36, color: "#3ab5e6" }} />, value: "—", color: "#e0f4fb" },
    { label: "Active Parents", icon: <SchoolIcon sx={{ fontSize: 36, color: "#f5a623" }} />, value: "—", color: "#fff4e0" },
    { label: "Total Children", icon: <SchoolIcon sx={{ fontSize: 36, color: "#7c4dff" }} />, value: "—", color: "#ede7f6" },
];

export default function AdminDashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await apiLogout(); } catch { /* ignore */ }
        logout();
        navigate("/admin", { replace: true });
    };

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
            {/* Sidebar */}
            <Box sx={{
                width: 260, flexShrink: 0,
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                display: "flex", flexDirection: "column",
                p: 3,
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
                    <AdminIcon sx={{ color: "#f5a623", fontSize: 32 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff" }}>
                        Kidaptive
                        <Typography component="span" sx={{ display: "block", fontSize: 11, color: "#888", fontWeight: 400, lineHeight: 1 }}>
                            Admin Console
                        </Typography>
                    </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 3 }} />

                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1.5, mb: 1.5 }}>
                        Navigation
                    </Typography>
                    {[
                        { label: "Dashboard", icon: <AdminIcon sx={{ fontSize: 20 }} />, active: true },
                        { label: "Users", icon: <PeopleIcon sx={{ fontSize: 20 }} />, active: false },
                    ].map((item) => (
                        <Box key={item.label} sx={{
                            display: "flex", alignItems: "center", gap: 1.5,
                            px: 2, py: 1.2, borderRadius: 2, mb: 0.5, cursor: "pointer",
                            background: item.active ? "rgba(58,181,230,0.15)" : "transparent",
                            color: item.active ? "#3ab5e6" : "#aaa",
                            transition: "all 0.2s",
                            "&:hover": { background: "rgba(58,181,230,0.1)", color: "#3ab5e6" },
                        }}>
                            {item.icon}
                            <Typography sx={{ fontWeight: item.active ? 700 : 400, fontSize: 14 }}>
                                {item.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ width: 36, height: 36, background: "#f5a623", fontSize: 14, fontWeight: 700 }}>
                        {user?.name?.[0]?.toUpperCase() ?? "A"}
                    </Avatar>
                    <Box>
                        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{user?.name}</Typography>
                        <Typography sx={{ color: "#666", fontSize: 11 }}>{user?.email}</Typography>
                    </Box>
                </Box>

                <PillButton
                    fullWidth
                    colorScheme="danger"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ fontSize: 13 }}
                >
                    Sign Out
                </PillButton>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, p: { xs: 3, md: 5 }, overflowY: "auto" }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#fff", mb: 0.5 }}>
                    Welcome, {user?.name} 👋
                </Typography>
                <Typography sx={{ color: "#666", mb: 5, fontSize: 15 }}>
                    Here's an overview of the Kidaptive platform.
                </Typography>

                {/* Stat Cards */}
                <Grid container spacing={3} sx={{ mb: 5 }}>
                    {statCards.map((card) => (
                        <Grid size={{ xs: 12, sm: 4 }} key={card.label}>
                            <Paper elevation={0} sx={{
                                borderRadius: 4, p: 3,
                                background: "rgba(255,255,255,0.04)",
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                display: "flex", alignItems: "center", gap: 2,
                                transition: "transform 0.2s",
                                "&:hover": { transform: "translateY(-4px)" },
                            }}>
                                <Box sx={{ p: 1.5, borderRadius: 3, background: card.color }}>
                                    {card.icon}
                                </Box>
                                <Box>
                                    <Typography sx={{ color: "#888", fontSize: 12, mb: 0.3 }}>{card.label}</Typography>
                                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 24 }}>{card.value}</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Info card */}
                <Paper elevation={0} sx={{
                    borderRadius: 4, p: 4,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(10px)",
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <AdminIcon sx={{ color: "#f5a623" }} />
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                            Admin Panel
                        </Typography>
                    </Box>
                    <Typography sx={{ color: "#888", lineHeight: 1.8 }}>
                        You are logged in as <strong style={{ color: "#f5a623" }}>admin</strong>.
                        Use this console to manage users, monitor activity, and configure the Kidaptive platform.
                        More admin tools will be available here as the platform grows.
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
}
