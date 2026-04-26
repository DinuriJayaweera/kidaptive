import { NavLink } from "react-router-dom";
import { Logout as LogoutIcon } from "@mui/icons-material";
import { parentNavSections } from "../navigation/parentNavConfig";
import { Drawer, Box } from "@mui/material";
import "../../admin/styles/adminLayout.css";
import logoImg from "../../../assets/logo.png";

interface ParentSidebarProps {
    onLogout: () => void;
    mobileOpen: boolean;
    onDrawerToggle: () => void;
}

export default function ParentSidebar({ onLogout, mobileOpen, onDrawerToggle }: ParentSidebarProps) {
    const drawerContent = (
        <aside className="admin-sidebar admin-sidebar--drawer">
            {/* Brand */}
            <div className="admin-sidebar__brand admin-sidebar__brand--drawer cursor-pointer" onClick={() => window.location.href = '/'}>
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
                        "&:hover": {
                            transform: "scale(1.05)",
                        },
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
                        alignItems: "center"
                    }}
                >
                    KIDAPTIVE
                </Box>
            </div>

            {/* Navigation */}
            <nav className="admin-sidebar__nav">
                {parentNavSections.map((section, sIdx) => (
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
                                end={item.path === "/parent/dashboard"}
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
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}
