import { useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { requestPasswordHelp } from "../../parent/api/childPasswordResetApi";
import loginBg from "../../../assets/login_bg.png";

export default function ChildForgotPage() {
    const selectedChild = (() => {
        try { return JSON.parse(sessionStorage.getItem("selectedChild") ?? "null"); } catch { return null; }
    })();

    const [username, setUsername] = useState<string>(selectedChild?.username ?? "");
    const [loading,  setLoading]  = useState(false);
    const [sent,     setSent]     = useState(false);
    const [error,    setError]    = useState("");

    const handleRequest = async () => {
        if (!username.trim()) { setError("Please enter your username first!"); return; }
        setLoading(true);
        setError("");
        try {
            await requestPasswordHelp(username.trim());
            setSent(true);
        } catch {
            setError("Something went wrong. Please try again.");
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
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 360,
                    backgroundColor: "rgba(255,255,255,0.90)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    borderRadius: "24px",
                    p: "28px 24px 22px",
                    border: "1px solid rgba(255,255,255,0.95)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                    textAlign: "center",
                }}
            >
                {sent ? (
                    /* ── Success state ── */
                    <>
                        <Box sx={{ fontSize: "3.5rem", mb: 1 }}>✅</Box>
                        <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: "1.4rem", color: "#1A1B4B", mb: 1 }}>
                            Request Sent!
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", color: "#475569", lineHeight: 1.6, mb: 2.5 }}>
                            Ask your parent to check their{" "}
                            <Box component="span" sx={{ fontWeight: 700, color: "#7C3AED" }}>notifications</Box>.
                            They can set a new emoji pattern for you!
                        </Typography>
                        <Box
                            component={Link}
                            to="/auth/child/pin"
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                fontSize: "0.82rem",
                                color: "#25AFF4",
                                textDecoration: "none",
                                fontWeight: 600,
                                "&:hover": { textDecoration: "underline" },
                            }}
                        >
                            <ArrowBackIcon sx={{ fontSize: 15 }} /> Back to login
                        </Box>
                    </>
                ) : (
                    /* ── Request state ── */
                    <>
                        <Box sx={{ fontSize: "3rem", mb: 0.5 }}>🔑</Box>
                        <Typography sx={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: "1.45rem", color: "#1A1B4B", lineHeight: 1.2, mb: 0.5 }}>
                            Forgot your pattern?
                        </Typography>
                        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.82rem", color: "#64748B", mb: 2 }}>
                            No worries! Ask a parent to help you reset it. 🌟
                        </Typography>

                        {/* Username display or input */}
                        {selectedChild ? (
                            <Box sx={{ mb: 2, py: 1, px: 2, backgroundColor: "rgba(241,245,249,0.9)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#475569" }}>
                                    👤 {selectedChild.name}
                                </Typography>
                            </Box>
                        ) : (
                            <Box
                                component="input"
                                placeholder="Your username"
                                value={username}
                                onChange={(e: any) => { setUsername(e.target.value); setError(""); }}
                                sx={{
                                    width: "100%",
                                    mb: 2,
                                    py: 1.2,
                                    px: 2,
                                    border: error ? "2px solid #ef4444" : "2px solid #E2E8F0",
                                    borderRadius: "12px",
                                    fontFamily: "'Poppins', sans-serif",
                                    fontSize: "0.9rem",
                                    color: "#1A1B4B",
                                    background: "rgba(241,245,249,0.9)",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    "&:focus": { borderColor: "#7C3AED" },
                                }}
                            />
                        )}

                        {error && (
                            <Typography sx={{ fontSize: "0.78rem", color: "#ef4444", mb: 1.5, fontFamily: "'Poppins', sans-serif" }}>
                                {error}
                            </Typography>
                        )}

                        {/* Action button */}
                        <Box
                            component="button"
                            onClick={handleRequest}
                            disabled={loading}
                            sx={{
                                width: "100%",
                                py: 1.4,
                                background: "#7C3AED",
                                color: "#fff",
                                border: "none",
                                borderRadius: "999px",
                                fontFamily: "'Baloo 2', cursive",
                                fontWeight: 800,
                                fontSize: "1rem",
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                                boxShadow: "0 6px 20px rgba(124,58,237,0.35)",
                                transition: "all 0.2s ease",
                                "&:hover": !loading ? { transform: "translateY(-2px)", boxShadow: "0 10px 28px rgba(124,58,237,0.45)" } : {},
                            }}
                        >
                            {loading
                                ? <CircularProgress size={18} sx={{ color: "#fff" }} />
                                : <> 📢 Ask Parent for Help </>
                            }
                        </Box>

                        {/* Back link */}
                        <Box sx={{ mt: 2 }}>
                            <Box
                                component={Link}
                                to="/auth/child/pin"
                                sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, fontSize: "0.75rem", color: "#25AFF4", textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
                            >
                                <ArrowBackIcon sx={{ fontSize: 13 }} /> Back to login
                            </Box>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
