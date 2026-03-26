import { Box, Typography, Grid, Paper } from "@mui/material";
import {
    People as PeopleIcon,
    School as SchoolIcon,
    ChildCare as ChildIcon,
} from "@mui/icons-material";
import { useAuth } from "../../auth/context/AuthContext";

const statCards = [
    {
        label: "Total Users",
        icon: <PeopleIcon sx={{ fontSize: 32, color: "#3498db" }} />,
        value: "—",
        bg: "#ebf5fb",
    },
    {
        label: "Active Parents",
        icon: <SchoolIcon sx={{ fontSize: 32, color: "#f59e0b" }} />,
        value: "—",
        bg: "#fef9ee",
    },
    {
        label: "Total Children",
        icon: <ChildIcon sx={{ fontSize: 32, color: "#8b5cf6" }} />,
        value: "—",
        bg: "#f3f0ff",
    },
];

export default function AdminDashboardPage() {
    const { user } = useAuth();

    return (
        <>
            <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#1a1a2e", mb: 0.5 }}
            >
                Welcome back, {user?.name} 👋
            </Typography>
            <Typography sx={{ color: "#7a8194", mb: 4, fontSize: 14 }}>
                Here's an overview of the Kidaptive platform.
            </Typography>

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((card) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.label}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                p: 3,
                                background: "#fff",
                                border: "1px solid #e8ecf1",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                transition: "box-shadow 0.2s, transform 0.2s",
                                "&:hover": {
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                                    transform: "translateY(-2px)",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2.5,
                                    background: card.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {card.icon}
                            </Box>
                            <Box>
                                <Typography
                                    sx={{
                                        color: "#7a8194",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        mb: 0.3,
                                    }}
                                >
                                    {card.label}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "#1a1a2e",
                                        fontWeight: 700,
                                        fontSize: 22,
                                    }}
                                >
                                    {card.value}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Info */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    p: 4,
                    background: "#fff",
                    border: "1px solid #e8ecf1",
                }}
            >
                <Typography
                    sx={{ color: "#1a1a2e", fontWeight: 600, fontSize: 15, mb: 1 }}
                >
                    Admin Panel
                </Typography>
                <Typography sx={{ color: "#7a8194", lineHeight: 1.8, fontSize: 14 }}>
                    You are logged in as{" "}
                    <strong style={{ color: "#3498db" }}>admin</strong>. Use this console
                    to manage users, monitor activity, and configure the Kidaptive
                    platform. More admin tools will be available here as the platform
                    grows.
                </Typography>
            </Paper>
        </>
    );
}
