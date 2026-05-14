import { useState } from "react";
import {
    Dialog, DialogContent, Box, Typography, Button,
    TextField, CircularProgress,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import { submitRating, notNowRating, neverAskRating } from "../api/ratingApi";

interface Props {
    open: boolean;
    onClose: () => void;
}

const starLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

export default function RatingPromptModal({ open, onClose }: Props) {
    const [hover, setHover]       = useState(0);
    const [selected, setSelected] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading]   = useState(false);
    const [done, setDone]         = useState(false);

    const reset = () => {
        setHover(0); setSelected(0); setFeedback(""); setLoading(false); setDone(false);
    };

    const handleSubmit = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            await submitRating({ rating: selected, feedback: feedback.trim() || undefined });
            setDone(true);
            setTimeout(() => { reset(); onClose(); }, 1800);
        } catch {
            setLoading(false);
        }
    };

    const handleNotNow = async () => {
        try { await notNowRating(); } catch { /* silent */ }
        reset(); onClose();
    };

    const handleNeverAsk = async () => {
        try { await neverAskRating(); } catch { /* silent */ }
        reset(); onClose();
    };

    const displayStar = hover || selected;

    return (
        <Dialog
            open={open}
            onClose={handleNotNow}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    p: 0,
                    overflow: "hidden",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
                },
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                {done ? (
                    /* ── Thank you screen ── */
                    <Box sx={{ textAlign: "center", py: 5, px: 4 }}>
                        <Typography sx={{ fontSize: "3rem", mb: 1 }}>🎉</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "#1a1a2e", mb: 0.5 }}>
                            Thank you!
                        </Typography>
                        <Typography sx={{ color: "#64748b", fontSize: "0.9rem" }}>
                            Your feedback helps us improve learning for children.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* ── Header ── */}
                        <Box
                            sx={{
                                background: "linear-gradient(135deg, #25AFF4 0%, #3b82f6 100%)",
                                px: 3,
                                pt: 3,
                                pb: 2.5,
                                textAlign: "center",
                            }}
                        >
                            <Typography sx={{ fontSize: "2rem", mb: 0.5 }}>⭐</Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#fff", mb: 0.4 }}>
                                How is your experience with Kidaptive?
                            </Typography>
                            <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>
                                Your feedback helps us improve learning for children.
                            </Typography>
                        </Box>

                        {/* ── Body ── */}
                        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                            {/* Star selector */}
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, mb: 0.5 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Box
                                        key={star}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                        onClick={() => setSelected(star)}
                                        sx={{
                                            cursor: "pointer",
                                            fontSize: "2.4rem",
                                            lineHeight: 1,
                                            transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                                            "&:hover": { transform: "scale(1.25)" },
                                            transform: displayStar >= star ? "scale(1.1)" : "scale(1)",
                                        }}
                                    >
                                        {displayStar >= star ? (
                                            <StarRoundedIcon sx={{ fontSize: "inherit", color: "#FBBF24" }} />
                                        ) : (
                                            <StarBorderRoundedIcon sx={{ fontSize: "inherit", color: "#d1d5db" }} />
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            {/* Star label */}
                            <Typography
                                sx={{
                                    textAlign: "center",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    color: displayStar ? "#FBBF24" : "#94a3b8",
                                    mb: 2.5,
                                    minHeight: "1.2em",
                                    transition: "color 0.2s",
                                }}
                            >
                                {starLabels[displayStar] || "Tap a star to rate"}
                            </Typography>

                            {/* Feedback */}
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Share your thoughts (optional)"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                inputProps={{ maxLength: 500 }}
                                sx={{
                                    mb: 2.5,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        fontSize: "0.88rem",
                                    },
                                }}
                            />

                            {/* Submit button */}
                            <Button
                                fullWidth
                                variant="contained"
                                disabled={!selected || loading}
                                onClick={handleSubmit}
                                sx={{
                                    backgroundColor: selected ? "#25AFF4" : "#e2e8f0",
                                    color: selected ? "#fff" : "#94a3b8",
                                    borderRadius: "999px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    py: 1.3,
                                    fontSize: "0.95rem",
                                    boxShadow: selected ? "0 4px 16px rgba(37,175,244,0.35)" : "none",
                                    transition: "all 0.25s ease",
                                    mb: 1,
                                    "&:hover": selected ? {
                                        backgroundColor: "#1e9cd9",
                                        transform: "translateY(-1px)",
                                        boxShadow: "0 8px 24px rgba(37,175,244,0.45)",
                                    } : {},
                                }}
                            >
                                {loading ? <CircularProgress size={22} color="inherit" /> : "Submit Rating"}
                            </Button>
                        </Box>

                        {/* ── Footer buttons ── */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                px: 3,
                                pb: 2.5,
                                borderTop: "1px solid #f1f5f9",
                                pt: 1.5,
                            }}
                        >
                            <Button
                                size="small"
                                onClick={handleNeverAsk}
                                sx={{
                                    textTransform: "none",
                                    color: "#94a3b8",
                                    fontSize: "0.78rem",
                                    "&:hover": { color: "#ef4444", backgroundColor: "#fef2f2" },
                                    borderRadius: "8px",
                                    px: 1.5,
                                }}
                            >
                                Never ask again
                            </Button>
                            <Button
                                size="small"
                                onClick={handleNotNow}
                                sx={{
                                    textTransform: "none",
                                    color: "#64748b",
                                    fontSize: "0.78rem",
                                    fontWeight: 600,
                                    "&:hover": { backgroundColor: "#f1f5f9" },
                                    borderRadius: "8px",
                                    px: 1.5,
                                }}
                            >
                                Not Now
                            </Button>
                        </Box>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
