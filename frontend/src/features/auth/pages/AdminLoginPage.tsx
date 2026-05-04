import { useState } from "react";
import {
    Box, Container, Typography, Alert, Grid,
    InputAdornment, IconButton,
} from "@mui/material";
import {
    Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon,
    Login as LoginIcon,
} from "@mui/icons-material";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { adminLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AuthHeader from "../components/AuthHeader";
import RoundedInput from "../../../components/ui/RoundedInput";
import PillButton from "../../../components/ui/PillButton";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";
import kipImg from "../../../assets/kip_b.png";

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [shakeForm, setShakeForm] = useState(false);

    const resetSuccess = (location.state as { resetSuccess?: boolean })?.resetSuccess;

    const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [f]: e.target.value });
        setError("");
    };

    const triggerShake = () => { setShakeForm(true); setTimeout(() => setShakeForm(false), 600); };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setError("");
        try {
            const result = await adminLogin(form);
            if (result.user && result.accessToken) {
                login(result.user, result.accessToken);
                const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/admin/dashboard";
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Login failed.");
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "var(--landing-hero-bg, linear-gradient(135deg,#e8f4fd,#f0f6ff))", display: "flex", alignItems: { xs: "flex-start", md: "center" }, position: "relative", py: { xs: 10, md: 0 } }}>
            <AuthHeader />

            <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 0 } }}>
                <Grid container spacing={4} alignItems="center">
                    {/* Left — illustration */}
                    <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: "center", display: { xs: "none", md: "block" } }}>
                        <AnimatedPage delay={100}>
                            <Box component="img" src={kipImg} alt="Kip mascot" sx={{ width: 280, mx: "auto", mb: 3 }} />
                            <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--landing-text-main, #1a1a2e)", mb: 1 }}>
                                System Administration
                            </Typography>
                            <Typography variant="body1" sx={{ color: "var(--landing-text-muted, #666)", maxWidth: 380, mx: "auto", lineHeight: 1.8 }}>
                                Secure access to Kidaptive's backend management console.
                            </Typography>
                        </AnimatedPage>
                    </Grid>

                    {/* Right — form */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <AnimatedPage shake={shakeForm}>
                            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ backgroundColor: "var(--card-bg, #fff)", borderRadius: 5, p: { xs: 3, md: 5 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", maxWidth: 440, mx: "auto" }}>
                                <AnimatedItem index={0}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.5 }}>
                                        <LoginIcon sx={{ color: "#3ab5e6", fontSize: 28 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>Admin Login</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "var(--text-secondary, #888)", textAlign: "center", mb: 3 }}>
                                        Authenticate to proceed
                                    </Typography>
                                </AnimatedItem>

                                {resetSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>Password reset successful! Log in with your new password.</Alert>}
                                {error && (
                                    <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                                        {error}
                                        {error.toLowerCase().includes("verify your email") && (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="body2">
                                                    <Box component={Link} to="/auth/verify-email" state={{ email: form.email }} sx={{ color: "inherit", fontWeight: 700, textDecoration: "underline" }}>
                                                        Go to verification page
                                                    </Box>
                                                </Typography>
                                            </Box>
                                        )}
                                    </Alert>
                                )}

                                <AnimatedItem index={3}>
                                    <RoundedInput label="Email" placeholder="admin@kidaptive.com" value={form.email} onChange={set("email")}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={4}>
                                    <RoundedInput label="Password" type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                                        slotProps={{
                                            input: {
                                                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "#bbb" }} /></InputAdornment>,
                                                endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPw(!showPw)} sx={{ transition: "all 0.2s" }}>{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
                                            }
                                        }}
                                        sx={{ mb: 3 }} />
                                </AnimatedItem>

                                <AnimatedItem index={6}>
                                    <PillButton type="submit" fullWidth colorScheme="primary" loading={loading} startIcon={<LoginIcon />}>
                                        Log In
                                    </PillButton>
                                </AnimatedItem>
                            </Box>
                        </AnimatedPage>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
