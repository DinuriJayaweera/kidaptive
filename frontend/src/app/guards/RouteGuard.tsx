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
    if (role !== "parent") return <Navigate to="/child/dashboard" replace />;
    return <>{children}</>;
}

export function ChildRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, role, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/auth/child/pin" state={{ from: location }} replace />;
    if (role !== "child") return <Navigate to="/parent/dashboard" replace />;
    return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, role, loading } = useAuth();
    if (loading) return <Loading />;
    if (isAuthenticated) {
        return <Navigate to={role === "parent" ? "/parent/dashboard" : "/child/dashboard"} replace />;
    }
    return <>{children}</>;
}
