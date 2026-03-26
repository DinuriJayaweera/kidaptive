import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import type { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";

function Loading() {
    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <CircularProgress />
        </Box>
    );
}

export function ParentRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, role, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location }} replace />;
    if (role === "child") return <Navigate to="/child/dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role !== "parent") return <Navigate to="/" replace />;
    return <>{children}</>;
}

export function ChildRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, role, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/auth/child/pin" state={{ from: location }} replace />;
    if (role === "parent") return <Navigate to="/parent/dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role !== "child") return <Navigate to="/" replace />;
    return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, role, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/auth/admin-login" state={{ from: location }} replace />;
    if (role === "parent") return <Navigate to="/parent/dashboard" replace />;
    if (role === "child") return <Navigate to="/child/dashboard" replace />;
    if (role !== "admin") return <Navigate to="/" replace />;
    return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, role, loading } = useAuth();
    if (loading) return <Loading />;
    if (isAuthenticated) {
        if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
        if (role === "parent") return <Navigate to="/parent/dashboard" replace />;
        if (role === "child") return <Navigate to="/child/dashboard" replace />;
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
