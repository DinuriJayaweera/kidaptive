import { useState } from "react";
import { Box, Container, Typography, Alert, InputAdornment } from "@mui/material";
import {
    LockReset as LockResetIcon,
    Email as EmailIcon,
    Send as SendIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import AuthHeader from "../components/AuthHeader";
import RoundedInput from "../../../components/ui/RoundedInput";
import PillButton from "../../../components/ui/PillButton";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [shakeForm, setShakeForm] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setError("");
        try {
            await forgotPassword({ email });
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Something went wrong.");
            setShakeForm(true);
            setTimeout(() => setShakeForm(false), 600);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#e8f4fd,#f0f6ff)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <AuthHeader />

            <Container maxWidth="xs">
                <AnimatedPage shake={shakeForm}>
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 4 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <AnimatedItem index={0}>
                            <LockResetIcon sx={{ fontSize: 56, color: "#f5a623", mb: 1 }} />
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Forgot Password?</Typography>
                            <Typography variant="body2" sx={{ color: "#888", mb: 3 }}>
                                Enter your email and we'll send you a reset code.
                            </Typography>
                        </AnimatedItem>

                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

                        {sent ? (
                            <AnimatedPage>
                                <Alert severity="success" sx={{ mb: 2, textAlign: "left", borderRadius: 3 }}>
                                    If an account with that email exists, a reset code has been sent. Check your inbox!
                                </Alert>
                                <Box component={Link} to="/auth/reset-password" state={{ email }} sx={{ display: "inline-block", mt: 1, textDecoration: "none" }}>
                                    <PillButton startIcon={<ArrowForwardIcon />}>
                                        Enter Reset Code
                                    </PillButton>
                                </Box>
                            </AnimatedPage>
                        ) : (
                            <>
                                <AnimatedItem index={1}>
                                    <RoundedInput label="Email Address" value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                        sx={{ mb: 3 }} />
                                </AnimatedItem>

                                <AnimatedItem index={2}>
                                    <PillButton type="submit" fullWidth loading={loading} startIcon={<SendIcon />}>
                                        Send Reset Code
                                    </PillButton>
                                </AnimatedItem>
                            </>
                        )}

                        <AnimatedItem index={3}>
                            <Box component={Link} to="/auth/login" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 3, fontSize: "0.85rem", color: "#888", textDecoration: "none", transition: "all 0.2s", "&:hover": { color: "#3ab5e6" } }}>
                                <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to login
                            </Box>
                        </AnimatedItem>
                    </Box>
                </AnimatedPage>
            </Container>
        </Box>
    );
}
