import {
    Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider,
} from "@mui/material";
import {
    Dashboard as DashboardIcon, People as PeopleIcon, Settings as SettingsIcon,
    Person as PersonIcon, Logout as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { logout as logoutApi } from "../../auth/api/authApi";

const items = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/parent/dashboard" },
    { label: "Children", icon: <PeopleIcon />, path: "/parent/children" },
    { label: "Settings", icon: <SettingsIcon />, path: "/parent/settings" },
    { label: "Profile", icon: <PersonIcon />, path: "/parent/profile" },
];

export default function ParentSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try { await logoutApi(); } catch { /* ignore */ }
        logout();
        navigate("/");
    };

    return (
        <Box sx={{
            width: { xs: "100%", md: 260 },
            backgroundColor: "#1a1a2e",
            color: "#fff",
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            p: { xs: 1, md: 3 },
            minHeight: { md: "100vh" },
        }}>
            <Typography variant="h6" sx={{
                fontWeight: 800, mb: { xs: 0, md: 3 },
                display: { xs: "none", md: "block" }, fontFamily: "'Baloo 2', sans-serif",
            }}>
                Kidaptive
            </Typography>

            <List sx={{ display: { xs: "flex", md: "block" }, flex: 1, p: 0 }}>
                {items.map((it) => (
                    <ListItemButton key={it.path}
                        onClick={() => navigate(it.path)}
                        selected={location.pathname === it.path}
                        sx={{
                            borderRadius: 2, mb: { md: 0.5 },
                            "&.Mui-selected": { backgroundColor: "rgba(58,181,230,0.15)", color: "#3ab5e6" },
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                            color: "#ccc",
                        }}>
                        <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{it.icon}</ListItemIcon>
                        <ListItemText primary={it.label} sx={{ display: { xs: "none", sm: "block" } }} />
                    </ListItemButton>
                ))}
            </List>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: { xs: 0, md: 2 }, display: { xs: "none", md: "block" } }} />

            <Box sx={{ display: { xs: "flex", md: "block" }, alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ color: "#888", mb: 0.5, display: { xs: "none", md: "block" }, fontSize: "0.75rem" }}>
                    Signed in as
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ display: { xs: "none", md: "block" }, mb: 1 }}>
                    {user?.name}
                </Typography>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: "#e74c3c", "&:hover": { backgroundColor: "rgba(231,76,60,0.1)" } }}>
                    <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Log out" sx={{ display: { xs: "none", sm: "block" } }} />
                </ListItemButton>
            </Box>
        </Box>
    );
}
