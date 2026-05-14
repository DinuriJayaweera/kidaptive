import { Box, Container, Typography, Grid, Link as MuiLink, Divider } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#1a1a2e",
        color: "#ccc",
        pt: 6,
        pb: 3,
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Brand */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography
              variant="h6"
              sx={{ color: "#fff", fontWeight: 800, letterSpacing: 1, mb: 1 }}
            >
              KIDAPTIVE
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaa", maxWidth: 280, lineHeight: 1.7 }}>
              Making English learning an adventure for kids everywhere, safe, fun, and effective.
            </Typography>
          </Grid>

          {/* Company */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mb: 1.5 }}>
              Company
            </Typography>
            <Box mb={0.8}>
              <MuiLink
                component={RouterLink}
                to="/about"
                underline="hover"
                sx={{ color: "#aaa", fontSize: "0.875rem", "&:hover": { color: "#fff" } }}
              >
                About Us
              </MuiLink>
            </Box>
            <Box mb={0.8}>
              <MuiLink
                component={RouterLink}
                to="/contact"
                underline="hover"
                sx={{ color: "#aaa", fontSize: "0.875rem", "&:hover": { color: "#fff" } }}
              >
                Contact Us
              </MuiLink>
            </Box>
          </Grid>

          {/* Legal */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mb: 1.5 }}>
              Legal
            </Typography>
            {["Privacy Policy", "Terms of Service", "Child Safety"].map((text) => (
              <Box key={text} mb={0.8}>
                <MuiLink
                  href="#"
                  underline="hover"
                  sx={{ color: "#aaa", fontSize: "0.875rem", "&:hover": { color: "#fff" } }}
                >
                  {text}
                </MuiLink>
              </Box>
            ))}
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: "#222", my: 3 }} />

        <Typography variant="caption" sx={{ color: "#555", display: "block", textAlign: "center" }}>
          © 2025 KIDAPTIVE. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
