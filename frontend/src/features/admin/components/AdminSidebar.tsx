import { NavLink } from "react-router-dom";
import { Logout as LogoutIcon } from "@mui/icons-material";
import { adminNavSections } from "../navigation/adminNavConfig";
import "../styles/adminLayout.css";

interface AdminSidebarProps {
    onLogout: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
    return (
        <aside className="admin-sidebar">
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
}
