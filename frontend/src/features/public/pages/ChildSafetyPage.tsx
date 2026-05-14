import { Box, Container, Typography, Paper, Divider } from "@mui/material";

/* ─── Static wave: bumps DOWN ─── */
const WaveDown = ({ from, to }: { from: string; to: string }) => (
  <Box sx={{ lineHeight: 0, overflow: "hidden", height: 70, mt: "-1px", mb: "-2px" }}>
    <Box component="svg" viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg"
      sx={{ display: "block", width: "100%", height: "72px" }}
      preserveAspectRatio="none">
      <rect width="1440" height="70" fill={to} />
      <path fill={from}
        d="M0,35 Q60,70 120,35 Q180,0 240,35 Q300,70 360,35 Q420,0 480,35 Q540,70 600,35 Q660,0 720,35 Q780,70 840,35 Q900,0 960,35 Q1020,70 1080,35 Q1140,0 1200,35 Q1260,70 1320,35 Q1380,0 1440,35 L1440,0 L0,0 Z"
      />
    </Box>
  </Box>
);

export default function ChildSafetyPage() {
  return (
    <Box sx={{ backgroundColor: "var(--landing-bg, #ffffff)", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box sx={{
        mt: "-100px",
        pt: { xs: "130px", md: "150px" },
        pb: { xs: 8, md: 10 },
        background: "linear-gradient(160deg, #E0F2FE 0%, #BAE6FD 100%)",
        textAlign: "center"
      }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 3 }}>
            Child Safety
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", fontWeight: 400 }}>
            Kidaptive's Commitment to a Safe, Ad-Free Learning Environment
          </Typography>
        </Container>
      </Box>

      {/* Content Section */}
      <Container maxWidth="md" sx={{ mt: -6, position: "relative", zIndex: 2, mb: 10 }}>
        <Paper sx={{ p: { xs: 4, md: 8 }, borderRadius: 5, boxShadow: "0 15px 35px rgba(0,0,0,0.06)" }}>
          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            1. Zero Ads, Zero Distractions
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            Kidaptive is built strictly for education. We guarantee a 100% ad-free experience. There are no pop-ups, no sponsored content, and no tracking scripts attempting to monetize your child's attention. Children using the platform will never be exposed to marketing material or encouraged to make in-app purchases.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            2. No External Links or Social Chat
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            To protect children from the unpredictable nature of the wider internet, the Kidaptive student interface acts as a "walled garden." There are no external hyperlinks leading out of the application from the child's dashboard. Furthermore, to prevent cyberbullying and inappropriate contact, we deliberately do not include text-based chat rooms, messaging features, or social networking capabilities between users.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            3. Age-Appropriate Content
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            All educational content, stories, reading comprehension exercises, and vocabulary challenges are vetted by educational experts. The adaptive algorithm ensures that children are only presented with material that matches their determined age group and cognitive level, preventing exposure to overly complex or mature themes.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            4. Screen Time Management
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            We believe in healthy digital habits. Our learning modules are broken down into bite-sized "Daily Quests" and short quiz sessions to encourage focused learning rather than prolonged screen time. Parents have full visibility into their child's activity log through the Parent Dashboard and can monitor exactly how much time is being spent on the platform.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            5. Anonymous Profiles
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            When a parent sets up a child profile, we encourage the use of playful nicknames and customizable avatars rather than real photos and full names. The system only tracks the child's learning progression—it never asks for or stores a child's real-world identity or physical location.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            6. Report a Concern
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            We are constantly evaluating our platform to ensure it remains the safest place on the internet for kids to learn English. If you ever come across content or functionality that concerns you regarding child safety, please immediately contact our safety team via the Contact Us page or email <strong>kidaptive.app@gmail.com</strong>.
          </Typography>
        </Paper>
      </Container>

      {/* Spacer to push wave to bottom if needed */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Wave transition into footer */}
      <Box sx={{ mt: "auto" }}>
        <WaveDown from="#ffffff" to="#1a1a2e" />
      </Box>
    </Box>
  );
}
