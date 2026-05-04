import { NavLink, useNavigate } from "react-router-dom";
import { Logout as LogoutIcon } from "@mui/icons-material";
import { adminNavSections } from "../navigation/adminNavConfig";
import { Drawer, Box } from "@mui/material";
import "../styles/adminLayout.css";
import logoImg from "../../../assets/logo.png";

interface AdminSidebarProps {
    onLogout: () => void;
    mobileOpen: boolean;
    onDrawerToggle: () => void;
}

export default function AdminSidebar({ onLogout, mobileOpen, onDrawerToggle }: AdminSidebarProps) {
    const navigate = useNavigate();

    const drawerContent = (
        <aside className="admin-sidebar admin-sidebar--drawer">
            <div
                className="admin-sidebar__brand admin-sidebar__brand--drawer admin-sidebar__brand--clickable"
                onClick={() => navigate("/")}
            >
                <Box
                    component="img"
                    src={logoImg}
                    alt="Kidaptive Logo"
                    sx={{
                        width: 72,
                        height: 65,
                        objectFit: "contain",
                        flexShrink: 0,
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
                        transition: "transform 0.3s ease",
                        "&:hover": { transform: "scale(1.05)" },
                    }}
                />
                <Box
                    sx={{
                        ml: "-4px",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 800,
                        fontSize: "22px",
                        color: "#25AFF4",
                        letterSpacing: 0.5,
                        lineHeight: 1,
                        userSelect: "none",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    KIDAPTIVE
                </Box>
            </div>

            <nav className="admin-sidebar__nav">
                {adminNavSections.map((section, sIdx) => (
                    <div key={sIdx}>
                        {section.title && (
                            <div className="admin-sidebar__nav-section-title">{section.title}</div>
                        )}
                        {section.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/admin/dashboard"}
                                onClick={() => { if (window.innerWidth < 900) onDrawerToggle(); }}
                                className={({ isActive }) =>
                                    `admin-sidebar__nav-item${isActive ? " admin-sidebar__nav-item--active" : ""}`
                                }
                            >
                                <item.icon className="admin-sidebar__nav-icon" />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="admin-sidebar__footer">
                <button className="admin-sidebar__logout-btn" onClick={onLogout}>
                    <LogoutIcon className="admin-sidebar__nav-icon" />
                    Log out
                </button>
            </div>
        </aside>
    );

    return (
        <Box component="nav" sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", md: "none" },
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
                }}
            >
                {drawerContent}
            </Drawer>
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: "none", md: "block" },
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240, borderRight: "1px solid var(--border-color, #e8ecf1)", overflow: "hidden" },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}
