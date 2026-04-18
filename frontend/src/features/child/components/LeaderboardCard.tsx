import { Box, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/LockRounded";

export default function LeaderboardCard() {
  return (
    <Box
      sx={{
        backgroundColor: "#F8FAFC",
        border: "2px solid #E2E8F0",
        borderRadius: "20px",
        p: 2.5,
        mt: 3,
        boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
      }}
    >
      <Typography
        sx={{
          fontFamily: "'Baloo 2', sans-serif",
          fontWeight: 800,
          fontSize: "1.1rem",
          color: "#1A202C",
          mb: 2,
        }}
      >
        Unlock Leaderboards!
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            backgroundColor: "#E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LockIcon sx={{ color: "#A0AEC0" }} />
        </Box>
        <Typography sx={{ fontSize: "0.85rem", color: "#4A5568", fontWeight: 500, lineHeight: 1.4 }}>
          Complete 5 more lessons to start competing
        </Typography>
      </Box>
    </Box>
  );
}
