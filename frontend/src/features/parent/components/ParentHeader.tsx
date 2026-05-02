import { useLocation, useNavigate } from "react-router-dom";
import { NotificationsNoneOutlined as BellIcon, Menu as MenuIcon } from "@mui/icons-material";
import { parentNavSections } from "../navigation/parentNavConfig";
import { AppBar, Toolbar, IconButton, Box } from "@mui/material";
import { useAuth } from "../../auth/context/AuthContext";
import "../../admin/styles/adminLayout.css";

interface ParentHeaderProps {
    userInitials: string;
    onDrawerToggle: () => void;
}

export default function ParentHeader({ userInitials, onDrawerToggle }: ParentHeaderProps) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Derive breadcrumb from current path using parent nav sections
    const currentNav = parentNavSections
        .flatMap((s) => s.items)
        .find((item) => pathname.startsWith(item.path));

    // Handle nested routes like /parent/child/:id
    let pageLabel = currentNav?.label ?? "Overview";
    if (!currentNav) {
        if (pathname.includes("/parent/child/")) pageLabel = "Child Progress";
        else if (pathname.includes("/parent/children/new")) pageLabel = "Add Child";
    }
    if (pageLabel === "Dashboard") pageLabel = "Overview";

    // The auth user stores the avatar in `avatar`, but the parent profile
    // stores it in `avatarUrl`. We check both so the header always shows
    // the most recently saved image regardless of which field was written.
    const avatarSrc = user?.avatarUrl || user?.avatar || null;

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                background: "#ffffff",
                borderBottom: "1px solid #e8ecf1",
                color: "#1a1a2e",
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
                        sx={{ mr: 1, display: { md: "none" }, color: "#5a607f" }}
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
                    <button className="admin-header__notification-btn" title="Notifications" aria-label="Notifications">
                        <BellIcon sx={{ fontSize: 22 }} />
                        <span className="admin-header__notification-dot" />
                    </button>
                    <Box
                        className="admin-header__avatar cursor-pointer"
                        onClick={() => navigate("/parent/profile")}
                        sx={{
                            overflow: "hidden",
                            padding: avatarSrc ? 0 : undefined,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {avatarSrc ? (
                            <Box
                                component="img"
                                src={avatarSrc}
                                alt="Profile"
                                sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                            />
                        ) : (
                            userInitials
                        )}
                    </Box>
                </div>
            </Toolbar>
        </AppBar>
    );
}