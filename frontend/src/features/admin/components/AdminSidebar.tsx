import { NavLink } from "react-router-dom";
import { Logout as LogoutIcon } from "@mui/icons-material";
import { adminNavSections } from "../navigation/adminNavConfig";
import { Drawer, Box } from "@mui/material";
import "../styles/adminLayout.css";

interface AdminSidebarProps {
    onLogout: () => void;
    mobileOpen: boolean;
    onDrawerToggle: () => void;
}

export default function AdminSidebar({ onLogout, mobileOpen, onDrawerToggle }: AdminSidebarProps) {
    const drawerContent = (
        <aside className="admin-sidebar" style={{ position: "static", width: "100%", height: "100%", borderRight: "none", zIndex: 1 }}>
            {/* Brand */}
            <div className="admin-sidebar__brand">
                <div className="admin-sidebar__logo">
                    <div className="admin-sidebar__logo-inner" />
                </div>
                <div>
                    <div className="admin-sidebar__title">Kidaptive</div>
                    <div className="admin-sidebar__subtitle">Admin Panel</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="admin-sidebar__nav">
                {adminNavSections.map((section, sIdx) => (
                    <div key={sIdx}>
                        {section.title && (
                            <div className="admin-sidebar__nav-section-title">
                                {section.title}
                            </div>
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

            {/* Footer — Logout */}
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
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240, borderRight: "1px solid #e8ecf1", overflow: "hidden" },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}
