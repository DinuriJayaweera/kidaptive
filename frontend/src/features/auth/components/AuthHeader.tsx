import { Box, IconButton, Typography } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";

export default function AuthHeader() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: { xs: 2, md: 4 },
                py: 1.5,
                zIndex: 10,
            }}
        >
            <IconButton
                onClick={() => navigate("/")}
                sx={{
                    backgroundColor: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    "&:hover": { backgroundColor: "#fff", transform: "scale(1.08)" },
                    transition: "all 0.2s",
                }}
            >
                <HomeIcon sx={{ color: "#3ab5e6" }} />
            </IconButton>

            <Typography
                component={Link}
                to="/"
                sx={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 900,
                    fontSize: "1.1rem",
                    color: "#1a1a2e",
                    textDecoration: "none",
                    letterSpacing: 1,
                    opacity: 0.7,
                }}
            >
                KIDAPTIVE
            </Typography>
        </Box>
    );
}
