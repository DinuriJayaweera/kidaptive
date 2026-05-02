import { Box, Typography, Button, LinearProgress } from "@mui/material";
import earnImg from "../../../assets/earn.png";
import gemsImg from "../../../assets/gems.png";

export default function DailyQuestCard() {
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        border: "2px solid #E2E8F0",
        borderRadius: "20px",
        p: 2.5,
        mt: 2,
        boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography
          sx={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
            color: "#1A202C",
          }}
        >
          Daily Quests
        </Typography>
        <Button
          variant="text"
          sx={{
            fontWeight: 800,
            fontSize: "0.75rem",
            color: "#25AFF4",
            p: 0,
            minWidth: "auto",
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          VIEW ALL
        </Button>
      </Box>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box
          component="img"
          src={earnImg}
          alt="Earn"
          sx={{ width: 28, height: 28, mt: 0.5, objectFit: "contain" }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#1A202C", mb: 1 }}>
            Earn 10 XP
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={10}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#E2E8F0",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#F6AD55",
                    borderRadius: 5,
                  },
                }}
              />
              <Typography sx={{ fontSize: "0.7rem", color: "#A0AEC0", fontWeight: 700, mt: 0.5 }}>
                1/10
              </Typography>
            </Box>
            <Box
              component="img"
              src={gemsImg}
              alt="Reward"
              sx={{ width: 24, height: 24, objectFit: "contain" }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
