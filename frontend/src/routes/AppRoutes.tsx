import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../features/public/pages/LandingPage";
import ChooseRolePage from "../features/public/pages/ChooseRolePage";
import LoginPage from "../features/auth/pages/LoginPage";
import ChildDashboardPage from "../features/child/pages/ChildDashboardPage";
import ParentDashboardPage from "../features/parent/pages/ParentDashboardPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/choose-role" element={<ChooseRolePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/child/dashboard" element={<ChildDashboardPage />} />
            <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}