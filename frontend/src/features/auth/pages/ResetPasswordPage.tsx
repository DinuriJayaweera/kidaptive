import { useState } from "react";
import { Box, Container, Typography, Alert, InputAdornment } from "@mui/material";
import {
    LockOpen as LockOpenIcon,
    Email as EmailIcon,
    Pin as PinIcon,
    Lock as LockIcon,
    ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import AuthHeader from "../components/AuthHeader";
import RoundedInput from "../../../components/ui/RoundedInput";
import PillButton from "../../../components/ui/PillButton";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const emailFromState = (location.state as { email?: string })?.email ?? "";

    const [form, setForm] = useState({ email: emailFromState, otp: "", newPassword: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [shakeForm, setShakeForm] = useState(false);

    const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [f]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setError("");
        try {
            await resetPassword(form);
            navigate("/auth/login", { state: { resetSuccess: true } });
        } catch (err: any) {
            const data = err.response?.data;
            if (data?.errors) {
                setError(data.errors.map((e: { message: string }) => e.message).join(". "));
            } else {
                setError(data?.message ?? "Something went wrong.");
            }
            setShakeForm(true);
            setTimeout(() => setShakeForm(false), 600);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#e8f4fd,#f0f6ff)", display: "flex", alignItems: { xs: "flex-start", md: "center" }, justifyContent: "center", position: "relative", py: { xs: 10, md: 0 } }}>
            <AuthHeader />

            <Container maxWidth="xs">
                <AnimatedPage shake={shakeForm}>
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 4 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <AnimatedItem index={0}>
                            <LockOpenIcon sx={{ fontSize: 56, color: "#e74c3c", mb: 1 }} />
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Reset Password</Typography>
                            <Typography variant="body2" sx={{ color: "#888", mb: 3 }}>Enter the code we sent to your email.</Typography>
                        </AnimatedItem>

                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

                        <AnimatedItem index={1}>
                            <RoundedInput label="Email" value={form.email} onChange={set("email")}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                sx={{ mb: 2 }} />
                        </AnimatedItem>

                        <AnimatedItem index={2}>
                            <RoundedInput label="6-Digit Reset Code" value={form.otp} onChange={set("otp")}
                                slotProps={{ htmlInput: { maxLength: 6 }, input: { startAdornment: <InputAdornment position="start"><PinIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                sx={{ mb: 2 }} />
                        </AnimatedItem>

                        <AnimatedItem index={3}>
                            <RoundedInput label="New Password" type="password" value={form.newPassword} onChange={set("newPassword")}
                                helperText="Min 8 chars, 1 uppercase, 1 number, 1 special"
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                sx={{ mb: 2 }} />
                        </AnimatedItem>

                        <AnimatedItem index={4}>
                            <RoundedInput label="Confirm Password" type="password" value={form.confirmPassword} onChange={set("confirmPassword")}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "#bbb" }} /></InputAdornment> } }}
                                sx={{ mb: 3 }} />
                        </AnimatedItem>

                        <AnimatedItem index={5}>
                            <PillButton type="submit" fullWidth colorScheme="primary" loading={loading} startIcon={<LockOpenIcon />}>
                                Reset Password
                            </PillButton>
                        </AnimatedItem>

                        <AnimatedItem index={6}>
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
