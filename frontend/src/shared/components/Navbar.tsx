import {
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../features/auth/context/AuthContext";
import logoImg from "../../assets/logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, role } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const dashboardPath =
    role === "parent" ? "/parent/dashboard" : "/child/dashboard";

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Features", path: "/#features" },
    ...(!isAuthenticated ? [{ label: "Login", path: "/auth/role" }] : []),
  ];

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        mt: "14px",
        /* ── Keyframes ── */
        "@keyframes logoBob": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "@keyframes slideDown": {
          from: { opacity: 0, transform: "translateY(-18px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* ── Blue pill navbar ── */}
      <Box
        sx={{
          backgroundColor: "#25AFF4",
          borderRadius: "30px",
          height: "70px",
          width: "calc(100% - 48px)",
          mx: "auto",
          pl: "8px",
          pr: "16px",
          display: "flex",
          alignItems: "center",
          boxShadow: "0 4px 18px rgba(37,175,244,0.25)",
          transition: "box-shadow 0.4s ease, transform 0.4s ease",
          animation: "slideDown 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
          overflow: "visible",
          "&:hover": {
            boxShadow: "0 6px 28px rgba(37,175,244,0.4)",
          },
        }}
      >
        {/* ── Logo + Brand ── */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            flexShrink: 0,
            gap: 0,
            mr: "auto",
          }}
        >
          <Box
            component="img"
            src={logoImg}
            alt="Kidaptive Logo"
            sx={{
              width: 118,
              height: 107,
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
              ml: "-8px",
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "28px",
              color: "#fff",
              letterSpacing: 1,
              lineHeight: 1,
              textShadow: "0 1px 4px rgba(0,0,0,0.1)",
              userSelect: "none",
            }}
          >
            KIDAPTIVE
          </Typography>
        </Box>

        {/* ── Desktop Nav Links ── */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: "36px",
            mr: "20px",
          }}
        >
          {navLinks.map((item, i) => (
            <Button
              key={item.label}
              onClick={() => navigate(item.path)}
              disableRipple
              sx={{
                color: "#fff",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "17px",
                textTransform: "none",
                p: 0,
                minWidth: "auto",
                position: "relative",
                overflow: "visible",
                transition: "all 0.25s ease",
                animation: `slideDown 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${0.08 * (i + 1)}s both`,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -3,
                  left: "50%",
                  width: 0,
                  height: "2.5px",
                  backgroundColor: "#FDC700",
                  borderRadius: "2px",
                  transform: "translateX(-50%)",
                  transition:
                    "width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                },
                "&:hover": {
                  backgroundColor: "transparent",
                  transform: "translateY(-2px)",
                  textShadow: "0 0 8px rgba(255,255,255,0.5)",
                  "&::after": { width: "100%" },
                },
                "&:active": { transform: "translateY(0px)" },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* ── CTA / Avatar ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {!isAuthenticated ? (
            <Button
              variant="contained"
              onClick={() => navigate("/auth/signup")}
              sx={{
                backgroundColor: "#FDC700",
                color: "#fff",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: "17px",
                height: "44px",
                borderRadius: "40px",
                textTransform: "none",
                px: "24px",
                boxShadow: "0 3px 12px rgba(253,199,0,0.35)",
                animation: "slideDown 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both",
                transition:
                  "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "&:hover": {
                  backgroundColor: "#E8B600",
                  transform: "scale(1.04) translateY(-1px)",
                  boxShadow: "0 6px 20px rgba(253,199,0,0.55)",
                },
                "&:active": {
                  transform: "scale(0.97)",
                  transition: "all 0.1s",
                },
              }}
            >
              Sign up
            </Button>
          ) : (
            <Tooltip title="Go to Dashboard">
              <IconButton
                onClick={() => navigate(dashboardPath)}
                size="small"
                sx={{
                  transition: "transform 0.25s ease",
                  "&:hover": { transform: "scale(1.1) rotate(4deg)" },
                }}
              >
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: "#FDC700",
                    fontWeight: 700,
                    fontSize: "18px",
                    border: "2.5px solid #fff",
                    boxShadow: "0 2px 8px rgba(253,199,0,0.3)",
                  }}
                >
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </Avatar>
              </IconButton>
            </Tooltip>
          )}

          {/* ── Mobile Menu Icon ── */}
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            sx={{
              display: { xs: "flex", md: "none" },
              ml: 1,
              color: "#fff",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "rotate(90deg)" },
            }}
            onClick={handleMenuOpen}
          >
            <MenuIcon sx={{ fontSize: 28 }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={{ display: { xs: "block", md: "none" } }}
            PaperProps={{
              sx: {
                borderRadius: 3,
                minWidth: 200,
                mt: 1,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              },
            }}
          >
            {[
              ...navLinks,
              ...(isAuthenticated
                ? [{ label: "Dashboard", path: dashboardPath }]
                : []),
            ].map((item) => (
              <MenuItem
                key={item.label}
                onClick={() => {
                  handleMenuClose();
                  navigate(item.path);
                }}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "1rem",
                  py: 1.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "var(--bg-hover, #E8F6FE)",
                    pl: 3,
                  },
                }}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}
