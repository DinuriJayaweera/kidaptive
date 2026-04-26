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
import ParentChildrenPage from "../features/parent/pages/ParentChildrenPage";
import ChildProgressPage from "../features/parent/pages/ChildProgressPage";
import ParentProfilePage from "../features/parent/pages/ParentProfilePage";
import ParentSettingsPage from "../features/parent/pages/ParentSettingsPage";
import ParentLayout from "../features/parent/layouts/ParentLayout";
import ChildDashboardPage from "../features/child/pages/ChildDashboardPage";
import ChildIntroPage from "../features/child/pages/ChildIntroPage";
import ChildIntroAchievements from "../features/child/pages/ChildIntroAchievements";
import ChildIntroFindLevel from "../features/child/pages/ChildIntroFindLevel";
import ChildIntroPlacement from "../features/child/pages/ChildIntroPlacement";
import ChildIntroLoading from "../features/child/pages/ChildIntroLoading";
import PlacementQuizPage from "../features/child/pages/PlacementQuizPage";
import PlacementResultsPage from "../features/child/pages/PlacementResultsPage";
import AdaptiveQuizPage from "../features/child/pages/AdaptiveQuizPage";
import CategoryProgressPage from "../features/child/pages/CategoryProgressPage";
import AdminLoginPage from "../features/auth/pages/AdminLoginPage";
import { PublicOnlyRoute, ParentRoute, ChildRoute, AdminRoute } from "../app/guards/RouteGuard";

// Admin layout + pages
import AdminLayout from "../features/admin/layouts/AdminLayout";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import AgeGroupsPage from "../features/admin/pages/AgeGroupsPage";
import PlacementTestsPage from "../features/admin/pages/PlacementTestsPage";
import QuizzesPage from "../features/admin/pages/QuizzesPage";
import CategoriesPage from "../features/admin/pages/CategoriesPage";
import UserManagementPage from "../features/admin/pages/UserManagementPage";
import PerformancePage from "../features/admin/pages/PerformancePage";
import SettingsPage from "../features/admin/pages/SettingsPage";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth — public only */}
            <Route path="/auth/role" element={<PublicOnlyRoute><RoleSelectPage /></PublicOnlyRoute>} />
            <Route path="/auth/admin-login" element={<PublicOnlyRoute><AdminLoginPage /></PublicOnlyRoute>} />
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
            <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            {/* Keep /admin as a legacy redirect to the login page */}
            <Route path="/admin" element={<Navigate to="/auth/admin-login" replace />} />

            {/* Parent — protected */}
            <Route element={<ParentRoute><ParentLayout /></ParentRoute>}>
                <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
                <Route path="/parent/children/new" element={<CreateChildPage />} />
                <Route path="/parent/children" element={<ParentChildrenPage />} />
                <Route path="/parent/child/:childId" element={<ChildProgressPage />} />
                <Route path="/parent/settings" element={<ParentSettingsPage />} />
                <Route path="/parent/profile" element={<ParentProfilePage />} />
            </Route>

            {/* Child — protected */}
            <Route path="/child/intro" element={<ChildRoute><ChildIntroPage /></ChildRoute>} />
            <Route path="/child/intro/achievements" element={<ChildRoute><ChildIntroAchievements /></ChildRoute>} />
            <Route path="/child/intro/find-level" element={<ChildRoute><ChildIntroFindLevel /></ChildRoute>} />
            <Route path="/child/intro/placement" element={<ChildRoute><ChildIntroPlacement /></ChildRoute>} />
            <Route path="/child/intro/loading" element={<ChildRoute><ChildIntroLoading /></ChildRoute>} />
            <Route path="/child/placement" element={<ChildRoute><PlacementQuizPage /></ChildRoute>} />
            <Route path="/child/placement/results" element={<ChildRoute><PlacementResultsPage /></ChildRoute>} />
            <Route path="/child/category-progress/:categoryId" element={<ChildRoute><CategoryProgressPage /></ChildRoute>} />
            <Route path="/child/quiz/:categoryId" element={<ChildRoute><AdaptiveQuizPage /></ChildRoute>} />
            <Route path="/child/dashboard" element={<ChildRoute><ChildDashboardPage /></ChildRoute>} />

            {/* Admin — protected (nested routes under layout) */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/age-groups" element={<AgeGroupsPage />} />
                <Route path="/admin/placement-tests" element={<PlacementTestsPage />} />
                <Route path="/admin/quizzes" element={<QuizzesPage />} />
                <Route path="/admin/categories" element={<CategoriesPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/performance" element={<PerformancePage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}