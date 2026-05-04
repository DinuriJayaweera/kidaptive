import { useState, useEffect } from "react";
import {
    Box, Container, Typography, Grid, Avatar, Alert, CircularProgress,
} from "@mui/material";
import {
    Face as FaceIcon,
    SentimentVerySatisfied as SmileyIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getMyChildren, type ChildProfile } from "../api/authApi";
import AuthHeader from "../components/AuthHeader";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";
import kipImg from "../../../assets/kip_a.png";

const avatarEmojis: Record<string, string> = {
    default: "🦖", dino: "🦕", rocket: "🚀", star: "⭐", bear: "🐻", cat: "🐱", dog: "🐶", unicorn: "🦄",
};

export default function ChildSelectPage() {
    const navigate = useNavigate();
    const [children, setChildren] = useState<ChildProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => { loadChildren(); }, []);

    const loadChildren = async () => {
        try {
            const data = await getMyChildren();
            setChildren(data);
        } catch {
            setError("Ask your parent to log in first so we can find your profile!");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (child: ChildProfile) => {
        sessionStorage.setItem("selectedChild", JSON.stringify(child));
        navigate("/auth/child/pin");
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "var(--landing-hero-bg, linear-gradient(135deg,#deeefe,#e8f4fd,#f0f6ff))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, px: 2, position: "relative" }}>
            <AuthHeader />

            <AnimatedPage>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Box component="img" src={kipImg} alt="Kip mascot" sx={{ width: { xs: 120, md: 180 }, mb: 2 }} />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
                        <SmileyIcon sx={{ fontSize: 32, color: "#3ab5e6" }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--landing-text-main, #1a1a2e)", fontSize: { xs: "1.6rem", md: "2.2rem" } }}>
                            Hi! Let's learn together!
                        </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: "var(--landing-text-muted, #666)", maxWidth: 400, mx: "auto" }}>
                        Tap your avatar to start your learning adventure.
                    </Typography>
                </Box>
            </AnimatedPage>

            <Container maxWidth="sm">
                <AnimatedPage delay={100}>
                    <Box sx={{ backgroundColor: "var(--card-bg, #fff)", borderRadius: 5, p: { xs: 3, md: 4 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 3 }}>
                            <FaceIcon sx={{ color: "#3ab5e6" }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Who's learning today?</Typography>
                        </Box>

                        {loading && <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>}
                        {error && <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

                        {!loading && children.length > 0 && (
                            <Grid container spacing={2} justifyContent="center">
                                {children.map((child, i) => (
                                    <Grid size={{ xs: 4, sm: 3 }} key={child._id}>
                                        <AnimatedItem index={i}>
                                            <Box onClick={() => handleSelect(child)} sx={{
                                                textAlign: "center", cursor: "pointer", p: 1.5, borderRadius: 4,
                                                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                                "&:hover": { backgroundColor: "var(--bg-hover, #e8f4fd)", transform: "scale(1.08) translateY(-4px)", boxShadow: "0 8px 24px rgba(58,181,230,0.15)" },
                                            }}>
                                                <Avatar sx={{ width: 64, height: 64, mx: "auto", mb: 1, fontSize: "2rem", backgroundColor: "var(--bg-subtle, #e0eeff)", transition: "all 0.2s" }}>
                                                    {avatarEmojis[child.avatar] ?? "🦖"}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>{child.name}</Typography>
                                            </Box>
                                        </AnimatedItem>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {!loading && children.length === 0 && !error && (
                            <Typography variant="body2" sx={{ textAlign: "center", color: "var(--text-secondary, #888)", py: 3 }}>
                                No profiles found. Ask your parent to create one!
                            </Typography>
                        )}
                    </Box>
                </AnimatedPage>
            </Container>
        </Box>
    );
}
