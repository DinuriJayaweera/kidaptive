import { useState } from "react";
import {
    Box, Container, Typography, Alert, Grid, InputAdornment,
} from "@mui/material";
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Login as LoginIcon,
    HowToReg as HowToRegIcon,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { parentSignup } from "../api/authApi";
import AuthHeader from "../components/AuthHeader";
import RoundedInput from "../../../components/ui/RoundedInput";
import PillButton from "../../../components/ui/PillButton";
import RoundCheckbox from "../../../components/ui/RoundCheckbox";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";
import kipImg from "../../../assets/images/kip_b.png";

export default function ParentSignupPage() {
    const navigate = useNavigate();
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

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#e8f4fd,#f0f6ff)", display: "flex", alignItems: "center", position: "relative" }}>
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
                                    <RoundedInput label="Full Name" placeholder="e.g. Jane Doe" value={form.name} onChange={set("name")}
                                        error={!!fieldErrors.name} helperText={fieldErrors.name}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={2}>
                                    <RoundedInput label="Email Address" placeholder="parent@example.com" value={form.email} onChange={set("email")}
                                        error={!!fieldErrors.email} helperText={fieldErrors.email}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={3}>
                                    <RoundedInput label="Password" type="password" value={form.password} onChange={set("password")}
                                        error={!!fieldErrors.password} helperText={fieldErrors.password || "Min 8 chars, 1 uppercase, 1 number, 1 special"}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={4}>
                                    <RoundedInput label="Confirm Password" type="password" value={form.confirmPassword} onChange={set("confirmPassword")}
                                        error={!!fieldErrors.confirmPassword} helperText={fieldErrors.confirmPassword}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 2 }} />
                                </AnimatedItem>

                                <AnimatedItem index={5}>
                                    <RoundCheckbox id="terms" checked={terms} onChange={setTerms}
                                        label="I agree to the Terms of Service and Privacy Policy." />
                                    <RoundCheckbox id="guardian" checked={guardian} onChange={setGuardian}
                                        label="I confirm I am a parent or legal guardian." />
                                </AnimatedItem>

                                <AnimatedItem index={6} sx={{ mt: 3 }}>
                                    <PillButton type="submit" fullWidth loading={loading} startIcon={<HowToRegIcon />}>
                                        Create account
                                    </PillButton>
                                </AnimatedItem>

                                <AnimatedItem index={7}>
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
