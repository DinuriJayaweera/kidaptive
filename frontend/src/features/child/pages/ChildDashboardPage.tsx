import { Box, Typography, Button } from "@mui/material";
import {
    EmojiEvents as TrophyIcon,
    Logout as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { logout as logoutApi } from "../../auth/api/authApi";
import AuthHeader from "../../auth/components/AuthHeader";

export default function ChildDashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await logoutApi(); } catch { /* ignore */ }
        logout();
        navigate("/");
    };

    return (
        <Box sx={{
            minHeight: "100vh",
            background: "linear-gradient(135deg,#deeefe,#e8f4fd,#f0f6ff)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            p: 4, textAlign: "center", position: "relative",
        }}>
            <AuthHeader />

            <TrophyIcon sx={{ fontSize: 72, color: "#f5a623", mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a2e", mb: 1 }}>
                Welcome, {user?.name ?? "Learner"}!
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", mb: 4, maxWidth: 400 }}>
                Your learning adventure starts here. Lessons are coming soon!
            </Typography>
            <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout}
                sx={{ borderRadius: "50px", textTransform: "none", fontWeight: 600, px: 4 }}>
                Log out
            </Button>
        </Box>
    );
}