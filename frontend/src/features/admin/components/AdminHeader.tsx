import { useLocation, useNavigate } from "react-router-dom";
import { NotificationsNoneOutlined as BellIcon, Menu as MenuIcon } from "@mui/icons-material";
import { adminNavSections } from "../navigation/adminNavConfig";
import { AppBar, Toolbar, IconButton, Box } from "@mui/material";
import { getUnreadCount } from "../api/adminNotificationsApi";
import { useEffect, useState } from "react";
import "../styles/adminLayout.css";

interface AdminHeaderProps {
    userInitials: string;
    onDrawerToggle: () => void;
}

export default function AdminHeader({ userInitials, onDrawerToggle }: AdminHeaderProps) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const refresh = async () => {
            try {
                const count = await getUnreadCount();
                if (!cancelled) setUnreadCount(count);
            } catch {
                // ignore
            }
        };
        refresh();
        const interval = setInterval(refresh, 30_000);
        const onUpdate = () => refresh();
        window.addEventListener("admin-notifications-updated", onUpdate);
        return () => {
            cancelled = true;
            clearInterval(interval);
            window.removeEventListener("admin-notifications-updated", onUpdate);
        };
    }, []);

    const currentNav = adminNavSections
        .flatMap((s) => s.items)
        .find((item) => pathname.startsWith(item.path));

    let pageLabel = currentNav?.label === "Dashboard" ? "Overview" : (currentNav?.label ?? "Overview");
    if (pathname === "/admin/profile") pageLabel = "Profile";

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                background: "var(--header-bg, #ffffff)",
                borderBottom: "1px solid var(--border-color, #e8ecf1)",
                color: "var(--text-primary, #1a1a2e)",
                zIndex: (theme) => theme.zIndex.drawer - 1,
            }}
        >
            <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 3 }, minHeight: "60px !important", p: "0 !important" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: { xs: 2, md: 4 } }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={onDrawerToggle}
                        sx={{ mr: 1, display: { md: "none" } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <div className="admin-header__breadcrumb">
                        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                            <span>Dashboard</span>
                            <span className="admin-header__breadcrumb-separator">/</span>
                        </Box>
                        <span className="admin-header__breadcrumb-current">{pageLabel}</span>
                    </div>
                </Box>

                <div className="admin-header__actions">
                    <button
                        className="admin-header__notification-btn"
                        title="Notifications"
                        aria-label="Notifications"
                        onClick={() => navigate("/admin/notifications")}
                    >
                        <Box sx={{ position: "relative", display: "inline-flex" }}>
                            <BellIcon style={{ fontSize: 22 }} />
                            {unreadCount > 0 && (
                                <Box sx={{
                                    position: "absolute",
                                    top: -3, right: -3,
                                    width: 9, height: 9,
                                    borderRadius: "50%",
                                    background: "#6366f1",
                                    border: "2px solid var(--header-bg, #fff)",
                                }} />
                            )}
                        </Box>
                    </button>
                    <div
                        className="admin-header__avatar"
                        onClick={() => navigate("/admin/profile")}
                        title="My Profile"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && navigate("/admin/profile")}
                    >
                        {userInitials}
                    </div>
                </div>
            </Toolbar>
        </AppBar>
    );
}
