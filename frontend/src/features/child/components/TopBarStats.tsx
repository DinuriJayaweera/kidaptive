import { Box, Typography } from "@mui/material";
import streakImg from "../../../assets/streak.png";
import gemsImg from "../../../assets/gems.png";
import xpsImg from "../../../assets/xps.png";

export default function TopBarStats({
    totalXp,
    streak,
    gems,
}: {
    totalXp: number;
    streak: number;
    gems: number;
}) {
    const pillStyle = {
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.5, sm: 1 },
        borderRadius: "30px",
        px: { xs: 1.5, sm: 2, md: 2.5 },
        py: { xs: 0.5, sm: 0.8 },
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        whiteSpace: "nowrap",
    };

    const iconSx = {
        width: { xs: 18, sm: 22, md: 24 },
        height: { xs: 18, sm: 22, md: 24 },
        objectFit: "contain" as const,
    };

    const textSx = {
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 800,
        fontSize: { xs: "0.78rem", sm: "0.9rem", md: "1rem" },
        whiteSpace: "nowrap" as const,
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5, md: 2 } }}>
            {/* Streak */}
            <Box sx={{ ...pillStyle, backgroundColor: "rgba(255,148,71,0.12)" }}>
                <Box component="img" src={streakImg} alt="Streak" sx={iconSx} />
                <Typography sx={{ ...textSx, color: "#FF9447" }}>{streak}</Typography>
            </Box>

            {/* XP */}
            <Box sx={{ ...pillStyle, backgroundColor: "rgba(253,199,0,0.12)" }}>
                <Box component="img" src={xpsImg} alt="XP" sx={iconSx} />
                <Typography sx={{ ...textSx, color: "#D4A000" }}>{totalXp} XP</Typography>
            </Box>

            {/* Gems */}
            <Box sx={{ ...pillStyle, backgroundColor: "rgba(37,175,244,0.12)" }}>
                <Box component="img" src={gemsImg} alt="Gems" sx={iconSx} />
                <Typography sx={{ ...textSx, color: "#25AFF4" }}>{gems}</Typography>
            </Box>
        </Box>
    );
}
