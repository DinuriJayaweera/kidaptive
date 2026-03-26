import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { logout as apiLogout } from "../../auth/api/authApi";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import "../styles/adminLayout.css";

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await apiLogout();
        } catch {
            /* ignore */
        }
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
        <div className="admin-layout">
            <AdminSidebar onLogout={handleLogout} />

            <div className="admin-main-wrapper">
                <AdminHeader userInitials={initials} />

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
