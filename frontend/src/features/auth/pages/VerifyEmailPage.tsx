import { useState, useRef, useEffect } from "react";
import { Box, Container, Typography, TextField, Alert } from "@mui/material";
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
    const refs = useRef<(HTMLInputElement | null)[]>([]);

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
        if (value && idx < 5) refs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
    };

    const handleSubmit = async () => {
        const code = otp.join("");
        if (code.length !== 6) { setError("Please enter all 6 digits."); triggerShake(); return; }
        setLoading(true);
        setError("");
        try {
            const result = await verifyEmailOtp({ email, otp: code });
            login(result.user, result.accessToken);
            navigate("/parent/dashboard", { replace: true });
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
            setTimeout(() => setSuccess(""), 4000);
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Failed to resend");
        } finally {
            setResending(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#e8f4fd,#f0f6ff)", display: "flex", alignItems: "center", justifyContent: "center", py: 4, position: "relative" }}>
            <AuthHeader />

            <Container maxWidth="xs">
                <AnimatedPage shake={shakeForm}>
                    <Box sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 4 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <AnimatedItem index={0}>
                            <MarkEmailReadIcon sx={{ fontSize: 56, color: "#3ab5e6", mb: 1 }} />
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Check your email</Typography>
                            <Typography variant="body2" sx={{ color: "#888", mb: 3 }}>
                                We sent a 6-digit code to <strong>{email}</strong>
                            </Typography>
                        </AnimatedItem>

                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

                        <AnimatedItem index={1}>
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 3 }}>
                                {otp.map((digit, i) => (
                                    <TextField key={i}
                                        inputRef={(el) => { refs.current[i] = el; }}
                                        value={digit}
                                        onChange={(e) => handleChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        slotProps={{ htmlInput: { maxLength: 1, style: { textAlign: "center", fontSize: "1.4rem", fontWeight: 700 } } }}
                                        sx={{
                                            width: 48,
                                            "& .MuiOutlinedInput-root": {
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

                        <AnimatedItem index={2}>
                            <PillButton fullWidth loading={loading} onClick={handleSubmit} startIcon={<VerifiedIcon />} sx={{ mb: 2 }}>
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
            </Container>
        </Box>
    );
}
