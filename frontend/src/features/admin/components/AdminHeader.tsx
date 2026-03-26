import { useLocation } from "react-router-dom";
import { NotificationsNoneOutlined as BellIcon } from "@mui/icons-material";
import { adminNavSections } from "../navigation/adminNavConfig";
import "../styles/adminLayout.css";

interface AdminHeaderProps {
    userInitials: string;
}

export default function AdminHeader({ userInitials }: AdminHeaderProps) {
    const { pathname } = useLocation();

    // Derive breadcrumb from current path
    const currentNav = adminNavSections
        .flatMap((s) => s.items)
        .find((item) => pathname.startsWith(item.path));
    const pageLabel = currentNav?.label === "Dashboard" ? "Overview" : (currentNav?.label ?? "Overview");

    return (
        <header className="admin-header">
            <div className="admin-header__breadcrumb">
                <span>Dashboard</span>
                <span className="admin-header__breadcrumb-separator">/</span>
                <span className="admin-header__breadcrumb-current">{pageLabel}</span>
            </div>

            <div className="admin-header__actions">
                <button className="admin-header__notification-btn">
                    <BellIcon style={{ fontSize: 22 }} />
                    <span className="admin-header__notification-dot" />
                </button>
                <div className="admin-header__avatar">{userInitials}</div>
            </div>
        </header>
    );
}
