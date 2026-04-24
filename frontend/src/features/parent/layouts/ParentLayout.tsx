import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { logout as apiLogout } from "../../auth/api/authApi";
import ParentSidebar from "../components/ParentSidebar";
import ParentHeader from "../components/ParentHeader";
import { Box } from "@mui/material";
import "../../admin/styles/adminLayout.css";

export default function ParentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = async () => {
        try {
            await apiLogout();
        } catch {
            /* ignore */
        }
        logout();
        navigate("/auth/login", { replace: true });
    };

    const initials =
        user?.name
            ?.split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) ?? "P";

    return (
        <Box className="admin-layout" sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fc", width: "100%", overflowX: "hidden" }}>
            <ParentSidebar 
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
                    width: { xs: "100%", md: `calc(100% - 240px)` },
                    marginLeft: "0px !important", 
                    minHeight: "100vh",
                    overflowX: "hidden"
                }}
            >
                <ParentHeader 
                    userInitials={initials} 
                    onDrawerToggle={handleDrawerToggle} 
                />

                <Box component="main" className="admin-content" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflowY: "auto" }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}

