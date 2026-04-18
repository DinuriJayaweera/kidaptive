import { Box, Typography } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import DiamondIcon from "@mui/icons-material/DiamondRounded";
import StarIcon from "@mui/icons-material/StarRounded";

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
    gap: 1,
    backgroundColor: "#E0F2FE", // Soft background highlight
    borderRadius: "30px",
    px: 2,
    py: 0.8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {/* ── Streak ── */}
      <Box sx={pillStyle}>
        <LocalFireDepartmentIcon sx={{ color: "#FF9447", fontSize: 24 }} />
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#FF9447" }}>
          {streak}
        </Typography>
      </Box>

      {/* ── XP ── */}
      <Box sx={pillStyle}>
        <StarIcon sx={{ color: "#25AFF4", fontSize: 24 }} />
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#25AFF4" }}>
          {totalXp} XP
        </Typography>
      </Box>

      {/* ── Gems ── */}
      <Box sx={pillStyle}>
        <DiamondIcon sx={{ color: "#25AFF4", fontSize: 24 }} />
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#25AFF4" }}>
          {gems}
        </Typography>
      </Box>
    </Box>
  );
}
