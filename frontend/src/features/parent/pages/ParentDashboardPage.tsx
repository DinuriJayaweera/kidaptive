import { useState, useEffect } from "react";
import {
    Box, Typography, Button, Grid, Avatar, CircularProgress, Alert,
} from "@mui/material";
import {
    AddCircle as AddIcon,
    School as SchoolIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { getMyChildren, type ChildProfile } from "../../auth/api/authApi";
import ParentSidebar from "../components/ParentSidebar";

const avatarEmojis: Record<string, string> = {
    default: "🦖", dino: "🦕", rocket: "🚀", star: "⭐", bear: "🐻", cat: "🐱", dog: "🐶", unicorn: "🦄",
};

export default function ParentDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [children, setChildren] = useState<ChildProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getMyChildren()
            .then(setChildren)
            .catch((err) => setError(err.response?.data?.message ?? "Failed to load children."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh" }}>
            <ParentSidebar />

            <Box sx={{ flex: 1, backgroundColor: "#f0f6ff", p: { xs: 2, md: 4 } }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                    Welcome, {user?.name}! 👋
                </Typography>
                <Typography variant="body1" sx={{ color: "#888", mb: 4 }}>
                    Manage your children's learning profiles here.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
                ) : children.length === 0 ? (
                    <Box sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 5 }, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                        <SchoolIcon sx={{ fontSize: 64, color: "#3ab5e6", mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Welcome! Let's add your child</Typography>
                        <Typography variant="body2" sx={{ color: "#888", mb: 3, maxWidth: 400, mx: "auto" }}>
                            Create a child profile so they can start their English learning journey.
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/parent/children/new")}
                            sx={{ backgroundColor: "#3ab5e6", borderRadius: "50px", textTransform: "none", fontWeight: 700, px: 4, py: 1.3, "&:hover": { backgroundColor: "#1ea0d0" } }}>
                            Add a child
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                            <Typography variant="h6" fontWeight={700}>Your kids</Typography>
                            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate("/parent/children/new")}
                                sx={{ backgroundColor: "#3ab5e6", borderRadius: "50px", textTransform: "none", fontWeight: 600, "&:hover": { backgroundColor: "#1ea0d0" } }}>
                                Add child
                            </Button>
                        </Box>
                        <Grid container spacing={2}>
                            {children.map((child) => (
                                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={child._id}>
                                    <Box sx={{
                                        backgroundColor: "#fff", borderRadius: 4, p: 3, textAlign: "center",
                                        boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "all 0.2s",
                                        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" },
                                    }}>
                                        <Avatar sx={{ width: 56, height: 56, mx: "auto", mb: 1, fontSize: "1.6rem", backgroundColor: "#e0eeff" }}>
                                            {avatarEmojis[child.avatar] ?? "🦖"}
                                        </Avatar>
                                        <Typography variant="body1" fontWeight={700}>{child.name}</Typography>
                                        <Typography variant="caption" sx={{ color: "#888" }}>Age {child.age} · @{child.username}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Box>
        </Box>
    );
}