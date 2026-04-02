import { Box, Container, Typography, Grid } from "@mui/material";
import {
    PersonAdd as PersonAddIcon,
    ChildCare as ChildCareIcon,
    Login as LoginIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import AuthHeader from "../components/AuthHeader";
import PillButton from "../../../components/ui/PillButton";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";
import kipImg from "../../../assets/kip.png";

export default function RoleSelectPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#e8f4fd 0%,#f0f6ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", py: 4, position: "relative" }}>
            <AuthHeader />

            <Container maxWidth="sm">
                <AnimatedPage>
                    <Box sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 5 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <AnimatedItem index={0}>
                            <Box component="img" src={kipImg} alt="Kip mascot" sx={{ width: 120, mb: 2 }} />
                        </AnimatedItem>

                        <AnimatedItem index={1}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a2e", mb: 1, fontSize: { xs: "1.6rem", md: "2rem" } }}>
                                Welcome! Who's logging in?
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#888", mb: 4 }}>
                                Choose your profile to continue.
                            </Typography>
                        </AnimatedItem>

                        <AnimatedItem index={2}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <PillButton fullWidth startIcon={<LoginIcon />} onClick={() => navigate("/auth/login")} sx={{ py: 1.8 }}>
                                        I'm a Parent
                                    </PillButton>
                                    <Typography variant="caption" sx={{ color: "#888", mt: 1, display: "block" }}>Access your dashboard</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <PillButton fullWidth colorScheme="primary" startIcon={<ChildCareIcon />} onClick={() => navigate("/auth/child/pin")} sx={{ py: 1.8 }}>
                                        I'm a Child
                                    </PillButton>
                                    <Typography variant="caption" sx={{ color: "#888", mt: 1, display: "block" }}>Start your adventure</Typography>
                                </Grid>
                            </Grid>
                        </AnimatedItem>

                        <AnimatedItem index={3}>
                            <Typography variant="body2" sx={{ mt: 4, color: "#aaa", fontSize: "0.8rem" }}>
                                Don't have an account?{" "}
                                <Box component="span" onClick={() => navigate("/auth/signup")}
                                    sx={{ cursor: "pointer", color: "#3ab5e6", fontWeight: 600, transition: "all 0.2s", "&:hover": { textDecoration: "underline" } }}>
                                    <PersonAddIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.3 }} />Sign up
                                </Box>
                            </Typography>
                        </AnimatedItem>
                    </Box>
                </AnimatedPage>
            </Container>
        </Box>
    );
}
