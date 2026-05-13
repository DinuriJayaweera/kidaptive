import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
} from "@mui/icons-material";

export const parentNavSections = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", path: "/parent/dashboard", icon: DashboardIcon },
            { label: "Children", path: "/parent/children", icon: PeopleIcon },
            { label: "Notifications", path: "/parent/notifications", icon: NotificationsIcon },
        ],
    },
    {
        title: "Account",
        items: [
            { label: "Settings", path: "/parent/settings", icon: SettingsIcon },
        ],
    },
];
