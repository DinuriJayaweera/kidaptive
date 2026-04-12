import { useGoogleLogin } from "@react-oauth/google";
import { googleLogin } from "../api/authApi";

import { useState } from "react";
import {
    Box, Container, Typography, Alert, Grid,
    Divider, InputAdornment, IconButton,
} from "@mui/material";
import {
    Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon,
    Login as LoginIcon, PersonAdd as PersonAddIcon,
    LockReset as LockResetIcon,
} from "@mui/icons-material";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { parentLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AuthHeader from "../components/AuthHeader";
import RoundedInput from "../../../components/ui/RoundedInput";
import PillButton from "../../../components/ui/PillButton";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";
import kipImg from "../../../assets/kip_b.png";

const GoogleColorIcon = () => (
    <svg width="20" height="20" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
        <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.7v2.24h2.91c1.7-1.57 2.69-3.89 2.69-6.57z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.35 0-4.33-1.59-5.05-3.73H.96v2.3C2.44 15.96 5.48 18 9 18z" />
        <path fill="#FBBC05" d="M3.95 10.73c-.18-.54-.28-1.12-.28-1.73s.1-1.19.28-1.73V4.97H.96c-.61 1.22-.96 2.6-.96 4.03s.35 2.81.96 4.03l2.99-2.3z" />
        <path fill="#EA4335" d="M9 3.57c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.48 0 2.44 2.04.96 4.97l2.99 2.3c.72-2.14 2.7-3.73 5.05-3.73z" />
    </svg>
);

export default function ParentLoginPage() {
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
            const result = await parentLogin(form);
            if (result.requiresVerification) {
                navigate("/auth/verify-email", { state: { email: result.email } });
                return;
            }
            if (result.user && result.accessToken) {
                login(result.user, result.accessToken);
                const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/parent/dashboard";
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Login failed.");
            triggerShake();
        } finally {
            setLoading(false);
        }
        
    };

    const handleGoogleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    setLoading(true);
    setError("");
    try {
      const result = await googleLogin({ token: tokenResponse.access_token });
      if (result.user && result.accessToken) {
        login(result.user, result.accessToken);
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/parent/dashboard";
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Google login failed.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  },
  onError: () => {
    setError("Google login was cancelled or failed.");
    triggerShake();
  },
});

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#e8f4fd,#f0f6ff)", display: "flex", alignItems: { xs: "flex-start", md: "center" }, position: "relative", py: { xs: 10, md: 0 } }}>
            <AuthHeader />

            <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 0 } }}>
                <Grid container spacing={4} alignItems="center">
                    {/* Left — illustration */}
                    <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: "center", display: { xs: "none", md: "block" } }}>
                        <AnimatedPage delay={100}>
                            <Box component="img" src={kipImg} alt="Kip mascot" sx={{ width: 280, mx: "auto", mb: 3 }} />
                            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a2e", mb: 1 }}>
                                Learning made fun for your little genius.
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#666", maxWidth: 380, mx: "auto", lineHeight: 1.8 }}>
                                Join thousands of parents and kids discovering the joy of adaptive English learning.
                            </Typography>
                        </AnimatedPage>
                    </Grid>

                    {/* Right — form */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <AnimatedPage shake={shakeForm}>
                            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 5 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", maxWidth: 440, mx: "auto" }}>
                                <AnimatedItem index={0}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.5 }}>
                                        <LoginIcon sx={{ color: "#3ab5e6", fontSize: 28 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>Welcome Back!</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "#888", textAlign: "center", mb: 3 }}>
                                        Let's continue the learning adventure.
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

                                <AnimatedItem index={1}>
                                    <PillButton fullWidth colorScheme="google" startIcon={<GoogleColorIcon />} sx={{ mb: 2 }} onClick={() => handleGoogleLogin()}>
  Continue with Google
</PillButton>
                                </AnimatedItem>

                                <AnimatedItem index={2}>
                                    <Divider sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary">Or sign in with email</Typography>
                                    </Divider>
                                </AnimatedItem>

                                <AnimatedItem index={3}>
                                    <RoundedInput label="Email" placeholder="parent@example.com" value={form.email} onChange={set("email")}
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
                                        sx={{ mb: 1 }} />
                                </AnimatedItem>

                                <AnimatedItem index={5}>
                                    <Box sx={{ textAlign: "right", mb: 3 }}>
                                        <Box component={Link} to="/auth/forgot-password" sx={{ display: "inline-flex", alignItems: "center", gap: 0.3, fontSize: "0.8rem", color: "#888", textDecoration: "none", transition: "all 0.2s", "&:hover": { color: "#3ab5e6" } }}>
                                            <LockResetIcon sx={{ fontSize: 14 }} /> Forgot password?
                                        </Box>
                                    </Box>
                                </AnimatedItem>

                                <AnimatedItem index={6}>
                                    <PillButton type="submit" fullWidth colorScheme="primary" loading={loading} startIcon={<LoginIcon />}>
                                        Log In
                                    </PillButton>
                                </AnimatedItem>

                                <AnimatedItem index={7}>
                                    <Typography variant="body2" sx={{ textAlign: "center", mt: 3, color: "#888" }}>
                                        Don't have an account?{" "}
                                        <Box component={Link} to="/auth/signup" sx={{ color: "#e74c3c", fontWeight: 600, textDecoration: "none", transition: "all 0.2s", "&:hover": { textDecoration: "underline" } }}>
                                            <PersonAddIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.3 }} />Create account
                                        </Box>
                                    </Typography>
                                </AnimatedItem>
                            </Box>
                        </AnimatedPage>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
