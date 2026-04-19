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
  const basePillStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    borderRadius: "30px",
    px: 2.5,
    py: 0.8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    whiteSpace: "nowrap"
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {/* ── Streak ── */}
      <Box sx={{ ...basePillStyle, backgroundColor: "rgba(255, 148, 71, 0.12)" }}>
        <Box
          component="img"
          src={streakImg}
          alt="Streak"
          sx={{ width: 24, height: 24, objectFit: "contain" }}
        />
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#FF9447", whiteSpace: "nowrap" }}>
          {streak}
        </Typography>
      </Box>

      {/* ── XP ── */}
      <Box sx={{ ...basePillStyle, backgroundColor: "rgba(253, 199, 0, 0.12)" }}>
        <Box
          component="img"
          src={xpsImg}
          alt="XP"
          sx={{ width: 24, height: 24, objectFit: "contain" }}
        />
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#D4A000", whiteSpace: "nowrap" }}>
          {totalXp} XP
        </Typography>
      </Box>

      {/* ── Gems ── */}
      <Box sx={{ ...basePillStyle, backgroundColor: "rgba(37, 175, 244, 0.12)" }}>
        <Box
          component="img"
          src={gemsImg}
          alt="Gems"
          sx={{ width: 24, height: 24, objectFit: "contain" }}
        />
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#25AFF4", whiteSpace: "nowrap" }}>
          {gems}
        </Typography>
      </Box>
    </Box>
  );
}
