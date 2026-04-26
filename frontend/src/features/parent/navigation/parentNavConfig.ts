import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
} from "@mui/icons-material";

export const parentNavSections = [
    {
        title: "Overview",
        items: [
            { label: "Dashboard", path: "/parent/dashboard", icon: DashboardIcon },
            { label: "Children", path: "/parent/children", icon: PeopleIcon },
        ],
    },
    {
        title: "Account",
        items: [
            { label: "Settings", path: "/parent/settings", icon: SettingsIcon },
        ],
    },
];
