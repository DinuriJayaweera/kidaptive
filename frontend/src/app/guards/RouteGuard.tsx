import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import type { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";

/** Returns the correct child landing path based on intro + placement state */
function getChildHome(user?: any): string {
    // If the backend already knows the child has done the placement test, we aggressively skip
    if (user?.placementCompleted) {
        return "/child/dashboard";
    }

    // Step 1: Check if intro was seen locally
    if (!user?._id || !localStorage.getItem(`introSeen_${user._id}`)) {
        return "/child/intro";
    }
    // Dashboard and Placement test components now strictly enforce routing via the backend API API.getStatus()
    return "/child/dashboard";
}

function Loading() {
    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <CircularProgress />
        </Box>
    );
}

export function ParentRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, role, loading, user } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location }} replace />;
    if (role === "child") return <Navigate to={getChildHome(user)} replace />;
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
    const { isAuthenticated, role, loading, user } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/auth/admin-login" state={{ from: location }} replace />;
    if (role === "parent") return <Navigate to="/parent/dashboard" replace />;
    if (role === "child") return <Navigate to={getChildHome(user)} replace />;
    if (role !== "admin") return <Navigate to="/" replace />;
    return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, role, loading, user } = useAuth();
    if (loading) return <Loading />;
    if (isAuthenticated) {
        if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
        if (role === "parent") return <Navigate to="/parent/dashboard" replace />;
        if (role === "child") return <Navigate to={getChildHome(user)} replace />;
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
