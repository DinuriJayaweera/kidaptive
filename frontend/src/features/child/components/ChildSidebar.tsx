import { Box, Typography, Stack, Button } from "@mui/material";
import HomeIcon from "@mui/icons-material/HomeRounded";
import MenuBookIcon from "@mui/icons-material/MenuBookRounded";
import TrackChangesIcon from "@mui/icons-material/TrackChangesRounded";
import EmojiEventsIcon from "@mui/icons-material/EmojiEventsRounded";
import DashboardIcon from "@mui/icons-material/DashboardRounded";
import PersonIcon from "@mui/icons-material/PersonRounded";
import MoreHorizIcon from "@mui/icons-material/MoreHorizRounded";
import LogoutIcon from "@mui/icons-material/LogoutRounded";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { logout as logoutApi } from "../../auth/api/authApi";
import dinoIcon from "../../../assets/5.png";

type NavItemObj = {
  label: string;
  icon: React.ElementType;
  isActive?: boolean;
};

const navItems: NavItemObj[] = [
  { label: "LEARN", icon: HomeIcon, isActive: true },
  { label: "LETTERS", icon: MenuBookIcon },
  { label: "PRACTICE", icon: TrackChangesIcon },
  { label: "LEADERBOARDS", icon: EmojiEventsIcon },
  { label: "QUESTS", icon: DashboardIcon },
  { label: "PROFILE", icon: PersonIcon },
  { label: "MORE", icon: MoreHorizIcon },
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 6, pl: 1 }}>
        <Box
          component="img"
          src={dinoIcon}
          alt="Dino Logo"
          sx={{ width: 42, height: 42, objectFit: "contain" }}
        />
        <Typography
          sx={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.45rem",
            color: "#25AFF4",
            letterSpacing: 0.5,
          }}
        >
          KIDAPTIVE
        </Typography>
      </Box>

      {/* ── Nav Items ── */}
      <Stack spacing={1.5}>
        {navItems.map((item) => {
          const Icon = item.icon;
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
              <Icon
                sx={{
                  color: item.isActive ? "#25AFF4" : "#4A5568",
                  fontSize: 26,
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
