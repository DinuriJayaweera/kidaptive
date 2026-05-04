import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { logout as apiLogout } from "../../auth/api/authApi";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { Box } from "@mui/material";
import { AdminThemeProvider } from "../context/AdminThemeContext";
import "../styles/adminLayout.css";

function AdminLayoutContent() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleLogout = async () => {
        try { await apiLogout(); } catch { /* ignore */ }
        logout();
        navigate("/auth/admin-login", { replace: true });
    };

    const initials =
        user?.name
            ?.split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) ?? "A";

    return (
        <Box
            className="admin-layout"
            sx={{ display: "flex", height: "100vh", overflow: "hidden", width: "100%" }}
        >
            <AdminSidebar
                onLogout={handleLogout}
                mobileOpen={mobileOpen}
                onDrawerToggle={handleDrawerToggle}
            />
            <Box
                className="admin-main-wrapper"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                <AdminHeader userInitials={initials} onDrawerToggle={handleDrawerToggle} />
                <Box component="main" className="admin-content" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}

export default function AdminLayout() {
    return (
        <AdminThemeProvider>
            <AdminLayoutContent />
        </AdminThemeProvider>
    );
}
