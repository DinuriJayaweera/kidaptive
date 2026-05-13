import { useState } from "react";
import { Box, Typography, Alert, InputAdornment } from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    LockOutlined as LockIcon,
    ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { childLogin, type ChildProfile } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import AnimatedPage from "../components/AnimatedPage";
import EmojiKeypad from "../components/EmojiKeypad";
import RoundedInput from "../../../components/ui/RoundedInput";
import loginBg from "../../../assets/login_bg.png";

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
            const result = await childLogin({ username, emojiPassword: emojiPassword.join("") });
            if (result.user && result.accessToken) {
                login(result.user, result.accessToken);
                sessionStorage.removeItem("selectedChild");
                if (result.user.placementCompleted) {
                    navigate("/child/dashboard", { replace: true });
                } else {
                    const introSeen = localStorage.getItem(`introSeen_${result.user._id}`);
                    navigate(introSeen ? "/child/dashboard" : "/child/intro", { replace: true });
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message ?? "Wrong pattern. Try again!");
            setEmojiPassword([]);
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                height: "100vh",
                overflow: "hidden",
                backgroundImage: `url(${loginBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
            }}
        >
            <AnimatedPage shake={shakeForm}>
                <Box
                    sx={{
                        width: "100%",
                        maxWidth: 360,
                        backgroundColor: "rgba(255, 255, 255, 0.88)",
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        borderRadius: "24px",
                        p: "12px 16px 10px",
                        border: "1px solid rgba(255,255,255,0.95)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                    }}
                >
                    {/* Title */}
                    <Box sx={{ textAlign: "center", mb: 1 }}>
                        <Typography
                            sx={{
                                fontFamily: "'Baloo 2', cursive",
                                fontWeight: 800,
                                fontSize: "1.5rem",
                                color: "#1A1B4B",
                                lineHeight: 1.1,
                            }}
                        >
                            Welcome{" "}
                            <Box component="span" sx={{ color: "#7C3AED" }}>Back!</Box>
                            <Box component="span" sx={{ color: "#FFCC35", ml: 0.5 }}>✦</Box>
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: "0.75rem",
                                color: "#475569",
                                fontWeight: 500,
                                mt: 0.25,
                            }}
                        >
                            Tap your secret emoji pattern to enter ⭐
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 1, borderRadius: 3, py: 0, fontSize: "0.8rem" }}>
                            {error}
                        </Alert>
                    )}

                    {/* Username */}
                    {selectedChild ? (
                        <Box
                            sx={{
                                mb: 1,
                                py: 1,
                                px: 1.5,
                                backgroundColor: "rgba(241,245,249,0.9)",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <PersonIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                            <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#475569" }}>
                                {childName}
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ mb: 1 }}>
                            <RoundedInput
                                fullWidth
                                placeholder="Your Username"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon sx={{ color: "#94A3B8" }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Pattern label */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.5, pl: 0.5 }}>
                        <LockIcon sx={{ color: "#94A3B8", fontSize: 14 }} />
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
                            Your secret emoji pattern
                        </Typography>
                    </Box>

                    {/* Emoji keypad — scaled down to fit viewport */}
                    <Box
                        sx={{
                            transform: "scale(0.8)",
                            transformOrigin: "top center",
                            marginBottom: "-94px",
                        }}
                    >
                        <EmojiKeypad
                            value={emojiPassword}
                            onChange={(v) => { setEmojiPassword(v); setError(""); }}
                            error={!!error}
                        />
                    </Box>

                    {/* Let's go button */}
                    <Box
                        component="button"
                        onClick={handleSubmit}
                        disabled={loading || emojiPassword.length !== 4}
                        sx={{
                            width: "100%",
                            mt: 1,
                            py: 1.2,
                            background: emojiPassword.length === 4 ? "#25AFF4" : "#CBD5E1",
                            color: "#fff",
                            border: "none",
                            borderRadius: "999px",
                            fontFamily: "'Baloo 2', cursive",
                            fontWeight: 800,
                            fontSize: "1rem",
                            cursor: emojiPassword.length === 4 && !loading ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            transition: "all 0.2s ease",
                            boxShadow: emojiPassword.length === 4 ? "0 6px 20px rgba(37,175,244,0.45)" : "none",
                            "&:hover": emojiPassword.length === 4 && !loading ? {
                                transform: "translateY(-2px)",
                                boxShadow: "0 10px 28px rgba(37,175,244,0.55)",
                            } : {},
                        }}
                    >
                        {loading ? "Loading…" : <> Let's go! <ArrowForwardIcon sx={{ fontSize: 18 }} /></>}
                    </Box>

                    {/* Footer */}
                    <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
                        {selectedChild ? (
                            <Box
                                component={Link}
                                to="/auth/child/select"
                                sx={{ display: "flex", alignItems: "center", gap: 0.4, fontSize: "0.75rem", color: "#25AFF4", textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
                            >
                                <ArrowBackIcon sx={{ fontSize: 13 }} /> Not {childName}?
                            </Box>
                        ) : (
                            <Box
                                component={Link}
                                to="/auth/role"
                                sx={{ display: "flex", alignItems: "center", gap: 0.4, fontSize: "0.75rem", color: "#25AFF4", textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
                            >
                                <ArrowBackIcon sx={{ fontSize: 13 }} /> Back to roles
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ textAlign: "center", mt: 0.5 }}>
                        <Box
                            component={Link}
                            to="/auth/child/forgot"
                            sx={{ fontSize: "0.7rem", color: "#94A3B8", textDecoration: "none", fontWeight: 500, "&:hover": { color: "#7C3AED", textDecoration: "underline" } }}
                        >
                            Forgot your pattern?
                        </Box>
                    </Box>
                </Box>
            </AnimatedPage>
        </Box>
    );
}
