import { Toolbar, Typography, Button, Box, Container } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

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

          {/* Nav Links */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {[
              { label: "Home", path: "/" },
              { label: "Features", path: "/#features" },
              { label: "Login", path: "/login" },
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

            {/* Sign Up Button */}
            <Button
              variant="contained"
              onClick={() => navigate("/choose-role")}
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
          </Box>
        </Toolbar>
      </Container>
    </Box>
  );
}
