import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../features/public/pages/LandingPage";
import AboutUsPage from "../features/public/pages/AboutUsPage";
import ContactUsPage from "../features/public/pages/ContactUsPage";
import PrivacyPolicyPage from "../features/public/pages/PrivacyPolicyPage";
import RoleSelectPage from "../features/auth/pages/RoleSelectPage";
import ParentSignupPage from "../features/auth/pages/ParentSignupPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import ParentLoginPage from "../features/auth/pages/ParentLoginPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import ChildSelectPage from "../features/auth/pages/ChildSelectPage";
import ChildPinPage from "../features/auth/pages/ChildPinPage";
import ChildForgotPage from "../features/auth/pages/ChildForgotPage";
import ParentDashboardPage from "../features/parent/pages/ParentDashboardPage";
import CreateChildPage from "../features/parent/pages/CreateChildPage";
import ParentChildrenPage from "../features/parent/pages/ParentChildrenPage";
import ChildProgressPage from "../features/parent/pages/ChildProgressPage";
import ParentProfilePage from "../features/parent/pages/ParentProfilePage";
import ParentSettingsPage from "../features/parent/pages/ParentSettingsPage";
import NotificationsPage from "../features/parent/pages/NotificationsPage";
import ChildPasswordResetPage from "../features/parent/pages/ChildPasswordResetPage";
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
import LettersPage from "../features/child/pages/LettersPage";
import ChildProfilePage from "../features/child/pages/ChildProfilePage";
import LeaderboardPage from "../features/child/pages/LeaderboardPage";
import PracticePage from "../features/child/pages/PracticePage";
import MistakesPracticePage from "../features/child/pages/MistakesPracticePage";
import AchievementsPage from "../features/child/pages/AchievementsPage";
import GamesPage from "../features/child/pages/GamesPage";
import DailyQuestPage from "../features/child/pages/DailyQuestPage";
import StoriesPage from "../features/child/pages/StoriesPage";
import StoryReaderPage from "../features/child/pages/StoryReaderPage";
import MusicPage from "../features/child/pages/MusicPage";
import QuestsPage from "../features/child/pages/QuestsPage";
import WordFinderGame from "../features/child/pages/games/WordFinderGame";
import SpellingChallengeGame from "../features/child/pages/games/SpellingChallengeGame";
import WordBuilderGame from "../features/child/pages/games/WordBuilderGame";
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
import AdminProfilePage from "../features/admin/pages/AdminProfilePage";
import DailyQuestQuestionsPage from "../features/admin/pages/DailyQuestQuestionsPage";
import AdminNotificationsPage from "../features/admin/pages/AdminNotificationsPage";
import AdminStoriesPage from "../features/admin/pages/AdminStoriesPage";
import AdminMusicPage from "../features/admin/pages/AdminMusicPage";
import AdminRatingsPage from "../features/admin/pages/AdminRatingsPage";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />

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
            <Route path="/auth/child/forgot" element={<ChildForgotPage />} />

            {/* Legacy redirects */}
            <Route path="/choose-role" element={<Navigate to="/auth/role" replace />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/auth/admin-login" replace />} />

            {/* Parent — protected */}
            <Route element={<ParentRoute><ParentLayout /></ParentRoute>}>
                <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
                <Route path="/parent/children/new" element={<CreateChildPage />} />
                <Route path="/parent/children" element={<ParentChildrenPage />} />
                <Route path="/parent/child/:childId" element={<ChildProgressPage />} />
                <Route path="/parent/settings" element={<ParentSettingsPage />} />
                <Route path="/parent/profile" element={<ParentProfilePage />} />
                <Route path="/parent/notifications" element={<NotificationsPage />} />
                <Route path="/parent/reset-child/:childId" element={<ChildPasswordResetPage />} />
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
            <Route path="/child/letters" element={<ChildRoute><LettersPage /></ChildRoute>} />
            <Route path="/child/profile" element={<ChildRoute><ChildProfilePage /></ChildRoute>} />
            <Route path="/child/leaderboards" element={<ChildRoute><LeaderboardPage /></ChildRoute>} />
            <Route path="/child/practice" element={<ChildRoute><PracticePage /></ChildRoute>} />
            <Route path="/child/practice/mistakes" element={<ChildRoute><MistakesPracticePage /></ChildRoute>} />
            <Route path="/child/achievements" element={<ChildRoute><AchievementsPage /></ChildRoute>} />
            <Route path="/child/quests" element={<ChildRoute><QuestsPage /></ChildRoute>} />
            <Route path="/child/daily-quest" element={<ChildRoute><DailyQuestPage /></ChildRoute>} />
            <Route path="/child/games" element={<ChildRoute><GamesPage /></ChildRoute>} />
            <Route path="/child/games/word-finder" element={<ChildRoute><WordFinderGame /></ChildRoute>} />
            <Route path="/child/games/spelling-challenge" element={<ChildRoute><SpellingChallengeGame /></ChildRoute>} />
            <Route path="/child/games/word-builder" element={<ChildRoute><WordBuilderGame /></ChildRoute>} />
            <Route path="/child/stories" element={<ChildRoute><StoriesPage /></ChildRoute>} />
            <Route path="/child/stories/:storyId" element={<ChildRoute><StoryReaderPage /></ChildRoute>} />
            <Route path="/child/music" element={<ChildRoute><MusicPage /></ChildRoute>} />

            {/* Admin — protected (nested routes under layout) */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/age-groups" element={<AgeGroupsPage />} />
                <Route path="/admin/placement-tests" element={<PlacementTestsPage />} />
                <Route path="/admin/quizzes" element={<QuizzesPage />} />
                <Route path="/admin/daily-quests" element={<DailyQuestQuestionsPage />} />
                <Route path="/admin/categories" element={<CategoriesPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/performance" element={<PerformancePage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="/admin/stories" element={<AdminStoriesPage />} />
                <Route path="/admin/music"   element={<AdminMusicPage />} />
                <Route path="/admin/ratings" element={<AdminRatingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
