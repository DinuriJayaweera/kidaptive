import {
    Dashboard as DashboardIcon,
    Group as AgeGroupIcon,
    Assignment as PlacementIcon,
    Quiz as QuizIcon,
    Category as CategoryIcon,
    People as UserMgmtIcon,
    TrendingUp as PerformanceIcon,
    Settings as SettingsIcon,
    EmojiEvents as DailyQuestIcon,
    MenuBook as StoriesIcon,
    MusicNote as MusicIcon,
} from "@mui/icons-material";

export interface NavItem {
    label: string;
    path: string;
    icon: typeof DashboardIcon;
}

export interface NavSection {
    title?: string;
    items: NavItem[];
}

export const adminNavSections: NavSection[] = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon },
        ],
    },
    {
        title: "Content",
        items: [
            { label: "Age Groups",        path: "/admin/age-groups",       icon: AgeGroupIcon },
            { label: "Placement Tests",   path: "/admin/placement-tests",  icon: PlacementIcon },
            { label: "Quizzes",           path: "/admin/quizzes",          icon: QuizIcon },
            { label: "Daily Quests",      path: "/admin/daily-quests",     icon: DailyQuestIcon },
            { label: "Stories",           path: "/admin/stories",          icon: StoriesIcon },
            { label: "Music",             path: "/admin/music",            icon: MusicIcon },
            { label: "Categories/Levels", path: "/admin/categories",       icon: CategoryIcon },
        ],
    },
    {
        title: "Management",
        items: [
            { label: "User Management", path: "/admin/users",        icon: UserMgmtIcon },
            { label: "Performance",     path: "/admin/performance",  icon: PerformanceIcon },
        ],
    },
    {
        title: "Account",
        items: [
            { label: "Settings", path: "/admin/settings", icon: SettingsIcon },
        ],
    },
];
