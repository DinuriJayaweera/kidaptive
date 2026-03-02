import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../features/public/pages/LandingPage";
import RoleSelectPage from "../features/auth/pages/RoleSelectPage";
import ParentSignupPage from "../features/auth/pages/ParentSignupPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import ParentLoginPage from "../features/auth/pages/ParentLoginPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import ChildSelectPage from "../features/auth/pages/ChildSelectPage";
import ChildPinPage from "../features/auth/pages/ChildPinPage";
import ParentDashboardPage from "../features/parent/pages/ParentDashboardPage";
import CreateChildPage from "../features/parent/pages/CreateChildPage";
import ChildDashboardPage from "../features/child/pages/ChildDashboardPage";
import { PublicOnlyRoute, ParentRoute, ChildRoute } from "../app/guards/RouteGuard";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth — public only */}
            <Route path="/auth/role" element={<PublicOnlyRoute><RoleSelectPage /></PublicOnlyRoute>} />
            <Route path="/auth/signup" element={<PublicOnlyRoute><ParentSignupPage /></PublicOnlyRoute>} />
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/login" element={<PublicOnlyRoute><ParentLoginPage /></PublicOnlyRoute>} />
            <Route path="/auth/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
            <Route path="/auth/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />

            {/* Child auth */}
            <Route path="/auth/child/select" element={<PublicOnlyRoute><ChildSelectPage /></PublicOnlyRoute>} />
            <Route path="/auth/child/pin" element={<PublicOnlyRoute><ChildPinPage /></PublicOnlyRoute>} />

            {/* Legacy redirects */}
            <Route path="/choose-role" element={<Navigate to="/auth/role" replace />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />

            {/* Parent — protected */}
            <Route path="/parent/dashboard" element={<ParentRoute><ParentDashboardPage /></ParentRoute>} />
            <Route path="/parent/children/new" element={<ParentRoute><CreateChildPage /></ParentRoute>} />
            <Route path="/parent/children" element={<ParentRoute><ParentDashboardPage /></ParentRoute>} />
            <Route path="/parent/settings" element={<ParentRoute><ParentDashboardPage /></ParentRoute>} />
            <Route path="/parent/profile" element={<ParentRoute><ParentDashboardPage /></ParentRoute>} />

            {/* Child — protected */}
            <Route path="/child/dashboard" element={<ChildRoute><ChildDashboardPage /></ChildRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}