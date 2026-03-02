import { Toolbar, Typography, Button, Box, Container, IconButton, Menu, MenuItem, Avatar, Divider, ListItemIcon, Tooltip } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Dashboard, Logout, Person } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../features/auth/context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, role, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate("/");
  };

  const dashboardPath = role === "parent" ? "/parent/dashboard" : "/child/dashboard";

  return (
    <Box sx={{ backgroundColor: "#3ab5e6", position: "sticky", top: 0, zIndex: 1100 }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          {/* Logo */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 900,
              fontSize: "1.35rem",
              color: "#fff",
              textDecoration: "none",
              letterSpacing: 1.5,
              flexGrow: 1,
            }}
          >
            KIDAPTIVE
          </Typography>

          {/* Desktop Nav Links */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
            {[
              { label: "Home", path: "/" },
              { label: "Features", path: "/#features" },
              ...(!isAuthenticated ? [{ label: "Login", path: "/auth/role" }] : []),
            ].map((item) => (
              <Button
                key={item.label}
                onClick={() => navigate(item.path)}
                sx={{
                  color: "#fff",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  textTransform: "none",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 6,
                    left: "50%",
                    width: 0,
                    height: "2px",
                    backgroundColor: "#fff",
                    borderRadius: "2px",
                    transform: "translateX(-50%)",
                    transition: "width 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.15)",
                    transform: "translateY(-2px)",
                    "&::after": { width: "65%" },
                  },
                  "&:active": { transform: "translateY(0px)" },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", ml: { xs: 0, md: 1 } }}>
            {!isAuthenticated ? (
              <Button
                variant="contained"
                onClick={() => navigate("/auth/signup")}
                sx={{
                  ml: 1,
                  backgroundColor: "#f5a623",
                  color: "#fff",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  borderRadius: "50px",
                  textTransform: "none",
                  px: 3,
                  boxShadow: "0 4px 14px rgba(245,166,35,0.45)",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  "&:hover": {
                    backgroundColor: "#e09010",
                    transform: "scale(1.12) rotate(-3deg)",
                    boxShadow: "0 8px 24px rgba(245,166,35,0.6)",
                  },
                  "&:active": { transform: "scale(0.95) rotate(0deg)", transition: "all 0.1s" },
                }}
              >
                Sign up
              </Button>
            ) : (
              <>
                <Button
                  sx={{
                    display: { xs: "none", md: "block" },
                    color: "#3ab5e6",
                    bgcolor: "#fff",
                    borderRadius: 5,
                    px: 3,
                    py: 0.8,
                    mr: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    "&:hover": { bgcolor: "#f8faff", transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.15)" },
                    transition: "all 0.2s"
                  }}
                  onClick={() => navigate(dashboardPath)}
                >
                  Go to Dashboard
                </Button>
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleUserMenuOpen}
                    size="small"
                    sx={{ ml: 1, transition: "transform 0.2s", "&:hover": { transform: "scale(1.05)" } }}
                    aria-controls={Boolean(userMenuAnchor) ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={Boolean(userMenuAnchor) ? 'true' : undefined}
                  >
                    <Avatar sx={{ width: 38, height: 38, bgcolor: "#f5a623", fontWeight: 700, border: "2px solid #fff" }}>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={userMenuAnchor}
                  id="account-menu"
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  onClick={handleUserMenuClose}
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 12px 32px rgba(0,0,0,0.12))',
                        mt: 1.5,
                        borderRadius: '20px',
                        minWidth: 220,
                        p: 1,
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        background: 'linear-gradient(145deg, #ffffff 0%, #fcfcfc 100%)',
                        backdropFilter: 'blur(10px)'
                      }
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => navigate(dashboardPath)} sx={{ py: 1.2, px: 2, borderRadius: '12px', mb: 0.5, transition: 'all 0.2s', '&:hover': { backgroundColor: '#f0f9ff', transform: 'translateX(4px)' } }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Dashboard fontSize="small" sx={{ color: "#3ab5e6" }} />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Poppins', sans-serif", color: "#2d3748" }}>Dashboard</Typography>
                  </MenuItem>
                  {role === "parent" && (
                    <MenuItem onClick={() => navigate("/parent/profile")} sx={{ py: 1.2, px: 2, borderRadius: '12px', mb: 0.5, transition: 'all 0.2s', '&:hover': { backgroundColor: '#f8f9fa', transform: 'translateX(4px)' } }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Person fontSize="small" sx={{ color: "#718096" }} />
                      </ListItemIcon>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Poppins', sans-serif", color: "#2d3748" }}>Profile</Typography>
                    </MenuItem>
                  )}
                  <Divider sx={{ my: 1, borderColor: 'rgba(0,0,0,0.06)' }} />
                  <MenuItem onClick={handleLogout} sx={{ py: 1.2, px: 2, borderRadius: '12px', transition: 'all 0.2s', '&:hover': { backgroundColor: '#fff5f5', transform: 'translateX(4px)' } }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Logout fontSize="small" sx={{ color: "#e53e3e" }} />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "'Poppins', sans-serif", color: "#e53e3e" }}>Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            )}

            {/* Mobile Menu Icon */}
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              sx={{ display: { xs: "flex", md: "none" }, ml: 1, color: "#fff" }}
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              sx={{ display: { xs: "block", md: "none" } }}
              PaperProps={{ sx: { borderRadius: 3, minWidth: 200, mt: 1 } }}
            >
              {[
                { label: "Home", path: "/" },
                { label: "Features", path: "/#features" },
                ...(!isAuthenticated ? [{ label: "Login", path: "/auth/role" }] : []),
                ...(isAuthenticated ? [{ label: "Dashboard", path: dashboardPath }] : []),
              ].map((item) => (
                <MenuItem
                  key={item.label}
                  onClick={() => {
                    handleMenuClose();
                    navigate(item.path);
                  }}
                  sx={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", py: 1.5 }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </Box>
  );
}
