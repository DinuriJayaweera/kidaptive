import { useState } from "react";
import {
    Box, Container, Typography, Alert, Grid, InputAdornment, Divider
} from "@mui/material";
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Login as LoginIcon,
    HowToReg as HowToRegIcon,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { parentSignup, googleSignup, googleLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AuthHeader from "../components/AuthHeader";
import RoundedInput from "../../../components/ui/RoundedInput";
import PillButton from "../../../components/ui/PillButton";
import RoundCheckbox from "../../../components/ui/RoundCheckbox";
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

export default function ParentSignupPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [terms, setTerms] = useState(false);
    const [guardian, setGuardian] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [shakeForm, setShakeForm] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [field]: e.target.value });
        setFieldErrors({ ...fieldErrors, [field]: "" });
        setError("");
    };

    const triggerShake = () => {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 600);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!terms || !guardian) {
            setError("Please accept the terms and confirm you are a parent/guardian.");
            triggerShake();
            return;
        }
        setLoading(true);
        setError("");
        setFieldErrors({});
        try {
            await parentSignup(form);
            navigate("/auth/verify-email", { state: { email: form.email } });
        } catch (err: any) {
            const data = err.response?.data;
            if (data?.errors) {
                const fe: Record<string, string> = {};
                data.errors.forEach((e: { field: string; message: string }) => { fe[e.field] = e.message; });
                setFieldErrors(fe);
            } else {
                setError(data?.message ?? "Something went wrong.");
            }
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError("");
            try {
                const result = await googleSignup({ token: tokenResponse.access_token });
                if (result.user && result.accessToken) {
                    login(result.user, result.accessToken);
                    navigate("/parent/dashboard");
                    return;
                }
            } catch (err: any) {
                if (err.response?.status === 409) {
                    try {
                        const loginResult = await googleLogin({ token: tokenResponse.access_token });
                        if (loginResult.user && loginResult.accessToken) {
                            login(loginResult.user, loginResult.accessToken);
                            navigate("/parent/dashboard");
                            return;
                        }
                        setError(loginResult.message ?? "Google login failed.");
                    } catch (loginErr: any) {
                        setError(loginErr.response?.data?.message ?? "Google login failed.");
                    }
                } else {
                    setError(err.response?.data?.message ?? "Google signup failed.");
                }
                triggerShake();
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError("Google signup was cancelled or failed.");
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
                            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
                                Empower Your Child's English Journey
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#666", mb: 4, maxWidth: 380, mx: "auto", lineHeight: 1.8 }}>
                                Monitor progress and celebrate every milestone. It's safe, parent-controlled, and smart.
                            </Typography>
                            <Box component="img" src={kipImg} alt="Kip mascot" sx={{ width: 260, mx: "auto" }} />
                        </AnimatedPage>
                    </Grid>

                    {/* Right — form */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <AnimatedPage shake={shakeForm}>
                            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 5 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", maxWidth: 460, mx: "auto" }}>
                                <AnimatedItem index={0}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                        <HowToRegIcon sx={{ color: "#3ab5e6", fontSize: 28 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>Create Parent Account</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: "#888", mb: 3 }}>Join the Kidaptive family today!</Typography>
                                </AnimatedItem>

                                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

                                <AnimatedItem index={1}>
                                    <PillButton
                                        fullWidth
                                        colorScheme="google"
                                        startIcon={<GoogleColorIcon />}
                                        sx={{ mb: 2 }}
                                        onClick={() => handleGoogleSignup()}
                                    >
                                        Sign up with Google
                                    </PillButton>
                                </AnimatedItem>

                                <AnimatedItem index={2}>
                                    <Divider sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary">Or sign up with email</Typography>
                                    </Divider>
                                </AnimatedItem>

                                <AnimatedItem index={3}>
                                    <RoundedInput label="Full Name" placeholder="e.g. Jane Doe" value={form.name} onChange={set("name")}
                                        error={!!fieldErrors.name} helperText={fieldErrors.name}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={4}>
                                    <RoundedInput label="Email Address" placeholder="parent@example.com" value={form.email} onChange={set("email")}
                                        error={!!fieldErrors.email} helperText={fieldErrors.email}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={5}>
                                    <RoundedInput label="Password" type="password" value={form.password} onChange={set("password")}
                                        error={!!fieldErrors.password} helperText={fieldErrors.password || "Min 8 chars, 1 uppercase, 1 number, 1 special"}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={6}>
                                    <RoundedInput label="Confirm Password" type="password" value={form.confirmPassword} onChange={set("confirmPassword")}
                                        error={!!fieldErrors.confirmPassword} helperText={fieldErrors.confirmPassword}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={7}>
                                    <RoundCheckbox id="terms" checked={terms} onChange={setTerms}
                                        label="I agree to the Terms of Service and Privacy Policy." />
                                    <RoundCheckbox id="guardian" checked={guardian} onChange={setGuardian}
                                        label="I confirm I am a parent or legal guardian." />
                                </AnimatedItem>

                                <AnimatedItem index={8} sx={{ mt: 3 }}>
                                    <PillButton type="submit" fullWidth colorScheme="primary" loading={loading} startIcon={<HowToRegIcon />}>
                                        Create account
                                    </PillButton>
                                </AnimatedItem>

                                <AnimatedItem index={9}>
                                    <Typography variant="body2" sx={{ textAlign: "center", mt: 2.5, color: "#888" }}>
                                        Already have an account?{" "}
                                        <Box component={Link} to="/auth/login" sx={{ color: "#e74c3c", fontWeight: 600, textDecoration: "none", transition: "all 0.2s", "&:hover": { textDecoration: "underline" } }}>
                                            <LoginIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.3 }} />Log in
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