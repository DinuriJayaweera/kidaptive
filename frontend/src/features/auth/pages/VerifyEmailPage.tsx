import { useState, useRef, useEffect } from "react";
import { Box, Container, Typography, TextField, Alert, Grid } from "@mui/material";
import {
    MarkEmailRead as MarkEmailReadIcon,
    Refresh as RefreshIcon,
    ArrowBack as ArrowBackIcon,
    VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyEmailOtp, resendOtp } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AuthHeader from "../components/AuthHeader";
import PillButton from "../../../components/ui/PillButton";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";

export default function VerifyEmailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const email = (location.state as { email?: string })?.email ?? "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [shakeForm, setShakeForm] = useState(false);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const refs = useRef<(HTMLInputElement | null)[]>([]);

    const disabled = remainingAttempts !== null && remainingAttempts <= 0;

    useEffect(() => {
        if (!email) navigate("/auth/signup", { replace: true });
    }, [email, navigate]);

    const triggerShake = () => { setShakeForm(true); setTimeout(() => setShakeForm(false), 600); };

    const handleChange = (idx: number, value: string) => {
        if (value.length > 1) return;
        if (value && !/^\d$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[idx] = value;
        setOtp(newOtp);
        setError("");
        setRemainingAttempts(null);
        if (value && idx < 5) refs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) { setError("Please enter all 6 digits."); triggerShake(); return; }
        setLoading(true);
        setError("");
        try {
            const result = await verifyEmailOtp({ email, otp: code });
            if (result.success === false) {
                setError(result.message);
                if (result.remainingAttempts !== undefined) {
                    setRemainingAttempts(result.remainingAttempts);
                }
                setOtp(["", "", "", "", "", ""]);
                refs.current[0]?.focus();
                triggerShake();
                return;
            }
            if (result.user && result.accessToken) {
                login(result.user, result.accessToken);
                navigate("/parent/dashboard", { replace: true });
            }
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Invalid OTP");
            setOtp(["", "", "", "", "", ""]);
            refs.current[0]?.focus();
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError("");
        try {
            await resendOtp({ email });
            setSuccess("A new code has been sent!");
            setRemainingAttempts(null);
            setTimeout(() => setSuccess(""), 4000);
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Failed to resend");
        } finally {
            setResending(false);
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
                                One Step Closer!
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#666", mb: 4, maxWidth: 380, mx: "auto", lineHeight: 1.8 }}>
                                Verify your email to start monitoring your child's progress and unlocking the full Kidaptive experience.
                            </Typography>
                        </AnimatedPage>
                    </Grid>

                    {/* Right — form */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <AnimatedPage shake={shakeForm}>
                            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 5 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", maxWidth: 460, mx: "auto", textAlign: "center" }}>
                                <AnimatedItem index={0}>
                                    <MarkEmailReadIcon sx={{ fontSize: 56, color: "#3ab5e6", mb: 1 }} />
                                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Check your email</Typography>
                                    <Typography variant="body2" sx={{ color: "#888", mb: 3 }}>
                                        We sent a 6-digit code to <strong>{email}</strong>
                                    </Typography>
                                </AnimatedItem>
                                <AnimatedItem index={1}>
                                    <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 0.5, sm: 1 }, mb: 3 }}>
                                        {otp.map((digit, i) => (
                                            <TextField key={i}
                                                inputRef={(el) => { refs.current[i] = el; }}
                                                value={digit}
                                                disabled={disabled}
                                                onChange={(e) => handleChange(i, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(i, e)}
                                                slotProps={{ htmlInput: { maxLength: 1, style: { textAlign: "center", fontSize: "1.4rem", fontWeight: 700, padding: 0, height: "100%" } } }}
                                                sx={{
                                                    width: { xs: 36, sm: 48 },
                                                    height: { xs: 48, sm: 56 },
                                                    "& .MuiOutlinedInput-root": {
                                                        height: "100%",
                                                        borderRadius: 2.5,
                                                        backgroundColor: digit ? "#e8f4fd" : "#f8fafc",
                                                        transition: "all 0.2s",
                                                        "& fieldset": { borderColor: digit ? "#3ab5e6" : "rgba(0,0,0,0.08)" },
                                                        "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(58,181,230,0.18)", "& fieldset": { borderColor: "#3ab5e6" } },
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </AnimatedItem>

                                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
                                {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

                                <AnimatedItem index={2}>
                                    {remainingAttempts !== null && remainingAttempts > 0 && (
                                        <Typography variant="caption" sx={{ color: "error.main", display: "block", mb: 2 }}>
                                            {remainingAttempts} attempt(s) remaining
                                        </Typography>
                                    )}
                                    <PillButton type="submit" fullWidth loading={loading} disabled={disabled} startIcon={<VerifiedIcon />} sx={{ mb: 2 }}>
                                        Verify Email
                                    </PillButton>
                                </AnimatedItem>

                                <AnimatedItem index={3}>
                                    <Typography variant="body2" sx={{ color: "#888" }}>
                                        Didn't get the code?{" "}
                                        <Box component="span" onClick={handleResend}
                                            sx={{ color: "#3ab5e6", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", "&:hover": { textDecoration: "underline" } }}>
                                            <RefreshIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.3 }} />
                                            {resending ? "Sending..." : "Resend code"}
                                        </Box>
                                    </Typography>
                                    <Box component={Link} to="/auth/signup" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 2, fontSize: "0.85rem", color: "#888", textDecoration: "none", transition: "all 0.2s", "&:hover": { color: "#3ab5e6" } }}>
                                        <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to signup
                                    </Box>
                                </AnimatedItem>
                            </Box>
                        </AnimatedPage>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
