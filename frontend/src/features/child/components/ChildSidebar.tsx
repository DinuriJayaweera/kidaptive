import { Box, Typography, Stack, Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/LogoutRounded";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { logout as logoutApi } from "../../auth/api/authApi";
import logoImg from "../../../assets/logo.png";

import learnIcon from "../../../assets/learn.png";
import lettersIcon from "../../../assets/letters.png";
import practiceIcon from "../../../assets/practice.png";
import leaderboardIcon from "../../../assets/leaderboard.png";
import questsIcon from "../../../assets/quests.png";
import profileIcon from "../../../assets/profile.png";
import moreIcon from "../../../assets/more.png";

type NavItemObj = {
  label: string;
  iconSrc: string;
  isActive?: boolean;
};

const navItems: NavItemObj[] = [
  { label: "LEARN", iconSrc: learnIcon, isActive: true },
  { label: "LETTERS", iconSrc: lettersIcon },
  { label: "PRACTICE", iconSrc: practiceIcon },
  { label: "LEADERBOARDS", iconSrc: leaderboardIcon },
  { label: "QUESTS", iconSrc: questsIcon },
  { label: "PROFILE", iconSrc: profileIcon },
  { label: "MORE", iconSrc: moreIcon },
];

export default function ChildSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    logout();
    navigate("/");
  };

  return (
    <Box
      sx={{
        width: 250,
        height: "100vh",
        position: "sticky",
        top: 0,
        borderRight: "2px solid #E2E8F0",
        backgroundColor: "transparent",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        py: 4,
        px: 3,
      }}
    >
      {/* ── Logo Area ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0, mb: 6, pl: 0 }}>
        <Box
          component="img"
          src={logoImg}
          alt="Kidaptive Logo"
          sx={{
            width: 72,
            height: 65,
            objectFit: "contain",
            flexShrink: 0,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
            transition: "transform 0.3s ease",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
        />
        <Typography
          sx={{
            ml: "-4px",
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "22px",
            color: "#25AFF4",
            letterSpacing: 0.5,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          KIDAPTIVE
        </Typography>
      </Box>

      {/* ── Nav Items ── */}
      <Stack spacing={1.5}>
        {navItems.map((item) => {
          return (
            <Box
              key={item.label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.2,
                px: 2,
                borderRadius: "30px",
                cursor: "pointer",
                transition: "all 0.2s",
                border: item.isActive ? "2px solid #25AFF4" : "2px solid transparent",
                backgroundColor: item.isActive ? "rgba(37,175,244,0.1)" : "transparent",
                "&:hover": {
                  backgroundColor: item.isActive ? "rgba(37,175,244,0.15)" : "rgba(0,0,0,0.04)",
                },
              }}
            >
              <Box
                component="img"
                src={item.iconSrc}
                alt={item.label}
                sx={{
                  width: 26,
                  height: 26,
                  objectFit: "contain",
                  opacity: item.isActive ? 1 : 0.6,
                  filter: item.isActive ? "none" : "grayscale(80%)",
                  transition: "all 0.2s",
                }}
              />
              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: item.isActive ? "#25AFF4" : "#1A202C",
                  letterSpacing: 0.5,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      {/* ── Logout Button ── */}
      <Box sx={{ mt: "auto", pt: 4 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            py: 1.2,
            borderRadius: "30px",
            borderColor: "#FF5144",
            color: "#FF5144",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            textTransform: "none",
            letterSpacing: 0.5,
            transition: "all 0.2s",
            "&:hover": {
              backgroundColor: "rgba(255,81,68,0.1)",
              borderColor: "#FF5144",
            },
          }}
        >
          Log out
        </Button>
      </Box>
    </Box>
  );
}
