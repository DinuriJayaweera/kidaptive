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
import achievementsIcon from "../../../assets/medal.png";

type NavLabel =
  | "LEARN"
  | "LETTERS"
  | "PRACTICE"
  | "LEADERBOARDS"
  | "ACHIEVEMENTS"
  | "QUESTS"
  | "PROFILE"
  | "MORE";

type NavItemObj = {
  label: NavLabel;
  iconSrc: string;
  route: string;
};

const navItems: NavItemObj[] = [
  { label: "LEARN", iconSrc: learnIcon, route: "/child/dashboard" },
  { label: "LETTERS", iconSrc: lettersIcon, route: "/child/letters" },
  { label: "PRACTICE", iconSrc: practiceIcon, route: "/child/practice" },
  { label: "LEADERBOARDS", iconSrc: leaderboardIcon, route: "/child/leaderboards" },
  { label: "ACHIEVEMENTS", iconSrc: achievementsIcon, route: "/child/achievements" },
  { label: "QUESTS", iconSrc: questsIcon, route: "/child/quests" },
  { label: "PROFILE", iconSrc: profileIcon, route: "/child/profile" },
  { label: "MORE", iconSrc: moreIcon, route: "/child/more" },
];

interface ChildSidebarProps {
  activePage?: NavLabel;
}

/**
 * Child sidebar — uses position: sticky so it stays fixed while scrolling
 * but still occupies space in the layout (no need to add marginLeft to
 * page content; the flex container handles it naturally).
 *
 * Width breakpoints:
 *   xs (mobile)  → 64px, icons only
 *   sm (tablet)  → 80px, icons only
 *   md (desktop) → 250px, icons + labels
 *
 * Icons are always full color. Active state shows via background + text.
 */
export default function ChildSidebar({ activePage = "LEARN" }: ChildSidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      /* ignore */
    }
    logout();
    navigate("/");
  };

  return (
    <Box
      sx={{
        // ── Sticky positioning — stays fixed when parent scrolls ──
        position: "sticky",
        top: 0,
        // alignSelf: flex-start prevents the sidebar from stretching
        // to match the longest content height, which is what was causing
        // the "scrolls with page" issue.
        alignSelf: "flex-start",

        width: { xs: 64, sm: 80, md: 250 },
        minWidth: { xs: 64, sm: 80, md: 250 },
        height: "100vh",
        // Don't shrink even if parent flex tries to compress us
        flexShrink: 0,

        backgroundColor: "#F4F8FB",
        borderRight: "2px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        py: 4,
        px: { xs: 1, md: 3 },
        // Allow internal scrolling on extremely short screens only
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 10,
      }}
    >
      {/* ── Logo Area ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          mb: 6,
          pl: 0,
          justifyContent: { xs: "center", md: "flex-start" },
        }}
      >
        <Box
          component="img"
          src={logoImg}
          alt="Kidaptive Logo"
          sx={{
            width: { xs: 40, md: 72 },
            height: { xs: 36, md: 65 },
            objectFit: "contain",
            flexShrink: 0,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
            transition: "transform 0.3s ease",
            "&:hover": { transform: "scale(1.05)" },
          }}
        />
        <Typography
          sx={{
            display: { xs: "none", md: "block" },
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
      <Stack spacing={1.5} sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = item.label === activePage;
          return (
            <Box
              key={item.label}
              onClick={() => navigate(item.route)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "center", md: "flex-start" },
                gap: 2,
                py: 1.2,
                px: { xs: 1, md: 2 },
                borderRadius: "30px",
                cursor: "pointer",
                transition: "all 0.2s",
                border: isActive ? "2px solid #25AFF4" : "2px solid transparent",
                backgroundColor: isActive
                  ? "rgba(37,175,244,0.1)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: isActive
                    ? "rgba(37,175,244,0.15)"
                    : "rgba(0,0,0,0.04)",
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
                  // Always full color, never grayscale
                  opacity: 1,
                  filter: "none",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  display: { xs: "none", md: "block" },
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: isActive ? "#25AFF4" : "#1A202C",
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
      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            py: 1.2,
            minWidth: 0,
            borderRadius: "30px",
            borderColor: "#FF5144",
            color: "#FF5144",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            textTransform: "none",
            letterSpacing: 0.5,
            transition: "all 0.2s",
            "& .MuiButton-startIcon": {
              mr: { xs: 0, md: 1 },
            },
            "& span:last-child": {
              display: { xs: "none", md: "inline" },
            },
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