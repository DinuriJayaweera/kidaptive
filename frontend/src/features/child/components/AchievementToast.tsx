import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import kipImg from "../../../assets/kip.png";

/**
 * Achievement toast — shown when a child unlocks a new achievement.
 *
 * Drop-in usage:
 *   <AchievementToast
 *     achievement={{ title: "On Fire", icon: "🔥" }}
 *     onClose={() => setToast(null)}
 *   />
 *
 * Auto-dismisses after `duration` ms (default 4500). Renders nothing if
 * `achievement` is null, so callers can do conditional rendering by
 * just toggling state.
 */
interface AchievementToastProps {
    achievement: { title: string; icon: string } | null;
    onClose: () => void;
    duration?: number;
}

export default function AchievementToast({
    achievement,
    onClose,
    duration = 4500,
}: AchievementToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!achievement) return;
        // Slight delay so the slide-in animation runs after mount
        const inTimer = setTimeout(() => setVisible(true), 50);
        const outTimer = setTimeout(() => setVisible(false), duration - 300);
        const closeTimer = setTimeout(onClose, duration);
        return () => {
            clearTimeout(inTimer);
            clearTimeout(outTimer);
            clearTimeout(closeTimer);
        };
    }, [achievement, duration, onClose]);

    if (!achievement) return null;

    return (
        <Box
            sx={{
                position: "fixed",
                top: { xs: 16, sm: 24 },
                left: "50%",
                transform: visible
                    ? "translate(-50%, 0)"
                    : "translate(-50%, -120%)",
                zIndex: 2000,
                transition: "transform 0.5s cubic-bezier(0.4, 1.4, 0.6, 1)",
                width: { xs: "92%", sm: "auto" },
                maxWidth: 420,
                backgroundColor: "#fff",
                borderRadius: "20px",
                border: "2px solid #FFD700",
                boxShadow: "0 8px 32px rgba(255, 215, 0, 0.35)",
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
            }}
            role="status"
            aria-live="polite"
        >
            {/* Kip on the left */}
            <Box
                component="img"
                src={kipImg}
                alt="Kip"
                sx={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    objectFit: "contain",
                }}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                    }}
                >
                    Kip says
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'Baloo 2', sans-serif",
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        fontWeight: 800,
                        color: "#1A202C",
                        lineHeight: 1.2,
                        mt: 0.3,
                    }}
                >
                    You earned {achievement.title}! {achievement.icon}
                </Typography>
            </Box>
        </Box>
    );
}
