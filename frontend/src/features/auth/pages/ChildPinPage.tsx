import { useState } from "react";
import { Box, Container, Typography, Alert, InputAdornment } from "@mui/material";
import {
    PlayArrow as PlayIcon,
    ArrowBack as ArrowBackIcon,
    Info as InfoIcon,
    Dialpad as DialpadIcon,
    Person as PersonIcon,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { childLogin, type ChildProfile } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AuthHeader from "../components/AuthHeader";
import PillButton from "../../../components/ui/PillButton";
import RoundedInput from "../../../components/ui/RoundedInput";
import AnimatedPage, { AnimatedItem } from "../components/AnimatedPage";
import EmojiKeypad from "../components/EmojiKeypad";

export default function ChildPinPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [emojiPassword, setEmojiPassword] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [shakeForm, setShakeForm] = useState(false);

    const selectedChild: ChildProfile | null = (() => {
        try { return JSON.parse(sessionStorage.getItem("selectedChild") ?? "null"); } catch { return null; }
    })();

    const childName = selectedChild?.name ?? "Learner";
    const [username, setUsername] = useState(selectedChild?.username || "");

    const triggerShake = () => { setShakeForm(true); setTimeout(() => setShakeForm(false), 600); };

    const handleSubmit = async () => {
        if (!username) { setError("Please enter your username!"); triggerShake(); return; }
        if (emojiPassword.length !== 4) { setError("Please enter all 4 emojis!"); triggerShake(); return; }

        setLoading(true);
        setError("");
        try {
            const result = await childLogin({
                username: username,
                // Passing it as emojiPassword to use the new "emoji" schema handler if they migrate,
                // but if their account is legacy "password", we can fallback if needed.
                emojiPassword: emojiPassword.join(""),
                // Since legacy accounts fall back to password and pin, pass them too so legacy doesn't break easily
                pin: emojiPassword.join(""),
                password: emojiPassword.join(""),
            });
            login(result.user, result.accessToken);
            sessionStorage.removeItem("selectedChild");
            navigate("/child/dashboard", { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Wrong pattern. Try again!");
            setEmojiPassword([]);
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#deeefe,#e8f4fd,#f0f6ff)", display: "flex", alignItems: "center", justifyContent: "center", py: 4, position: "relative" }}>
            <AuthHeader />

            <Container maxWidth="xs">
                <AnimatedPage shake={shakeForm}>
                    <Box sx={{ backgroundColor: "#fff", borderRadius: 5, p: { xs: 3, md: 4 }, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <AnimatedItem index={0}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.5 }}>
                                <DialpadIcon sx={{ color: "#3ab5e6", fontSize: 28 }} />
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>Welcome, {childName}! 👋</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: "#888", mb: 3 }}>Tap your secret emoji pattern.</Typography>
                        </AnimatedItem>

                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

                        <AnimatedItem index={0.5}>
                            {!selectedChild && (
                                <Box sx={{ mb: 3 }}>
                                    <RoundedInput
                                        fullWidth
                                        placeholder="Your Username"
                                        value={username}
                                        onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon sx={{ color: "#aaa" }} />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Box>
                            )}
                        </AnimatedItem>

                        <AnimatedItem index={1}>
                            <Box sx={{ p: 1 }}>
                                <EmojiKeypad
                                    value={emojiPassword}
                                    onChange={(v) => {
                                        setEmojiPassword(v);
                                        setError("");
                                    }}
                                    error={!!error}
                                />
                            </Box>
                        </AnimatedItem>

                        <AnimatedItem index={2}>
                            <PillButton fullWidth colorScheme="accent" loading={loading} onClick={handleSubmit}
                                disabled={emojiPassword.length !== 4} startIcon={<PlayIcon />}>
                                Let's go!
                            </PillButton>
                        </AnimatedItem>

                        <AnimatedItem index={3}>
                            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                                    <InfoIcon sx={{ fontSize: 14, color: "#bbb" }} />
                                    <Typography variant="caption" sx={{ color: "#888", maxWidth: 140, textAlign: "left", lineHeight: 1.2 }}>Forget your password? Ask a parent to reset it.</Typography>
                                </Box>
                                {selectedChild ? (
                                    <Box component={Link} to="/auth/child/select" sx={{ display: "flex", alignItems: "center", gap: 0.3, fontSize: "0.75rem", color: "#3ab5e6", textDecoration: "none", fontWeight: 600, transition: "all 0.2s", "&:hover": { textDecoration: "underline" } }}>
                                        <ArrowBackIcon sx={{ fontSize: 14 }} /> Not {childName}?
                                    </Box>
                                ) : (
                                    <Box component={Link} to="/auth/role" sx={{ display: "flex", alignItems: "center", gap: 0.3, fontSize: "0.75rem", color: "#3ab5e6", textDecoration: "none", fontWeight: 600, transition: "all 0.2s", "&:hover": { textDecoration: "underline" } }}>
                                        <ArrowBackIcon sx={{ fontSize: 14 }} /> Back to roles
                                    </Box>
                                )}
                            </Box>
                        </AnimatedItem>
                    </Box>
                </AnimatedPage>
            </Container>
        </Box>
    );
}
