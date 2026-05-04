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
        icon: <PeopleIcon sx={{ fontSize: 32, color: "#25AFF4" }} />,
        value: "—",
        bg: "rgba(37,175,244,0.12)",
    },
    {
        label: "Active Parents",
        icon: <SchoolIcon sx={{ fontSize: 32, color: "#FFCC35" }} />,
        value: "—",
        bg: "rgba(255,204,53,0.12)",
    },
    {
        label: "Total Children",
        icon: <ChildIcon sx={{ fontSize: 32, color: "#8EE870" }} />,
        value: "—",
        bg: "rgba(142,232,112,0.12)",
    },
];

export default function AdminDashboardPage() {
    const { user } = useAuth();

    return (
        <Box sx={{ fontFamily: "'Poppins', sans-serif" }}>
            <Typography
                variant="h5"
                sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}
            >
                Welcome back, {user?.name} 👋
            </Typography>
            <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", mb: 4, fontSize: 14 }}>
                Here's an overview of the Kidaptive platform.
            </Typography>

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((card) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.label}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: "16px",
                                p: 3,
                                background: "var(--card-bg)",
                                border: "1px solid var(--border-color)",
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
                                    borderRadius: "16px",
                                    background: card.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)",
                                }}
                            >
                                {card.icon}
                            </Box>
                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily: "'Poppins', sans-serif",
                                        color: "var(--text-secondary)",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        mb: 0.3,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {card.label}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: "'Baloo 2', cursive",
                                        color: "var(--text-primary)",
                                        fontWeight: 700,
                                        fontSize: 28,
                                        lineHeight: 1,
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
                    borderRadius: "16px",
                    p: 4,
                    background: "var(--card-bg)",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                }}
            >
                <Typography
                    sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-primary)", fontWeight: 600, fontSize: 15, mb: 1.5 }}
                >
                    Admin Panel
                </Typography>
                <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "var(--text-secondary)", lineHeight: 1.8, fontSize: 13.5 }}>
                    You are logged in as{" "}
                    <Box component="strong" sx={{ color: "#25AFF4", fontWeight: 600 }}>admin</Box>. Use this console
                    to manage users, monitor activity, and configure the Kidaptive
                    platform. More admin tools will be available here as the platform
                    grows.
                </Typography>
            </Paper>
        </Box>
    );
}
