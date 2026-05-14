import { Box, Container, Typography, Grid, Card, CardContent } from "@mui/material";
import kipImg from "../../../assets/Hi 3.png";
import dinoImg from "../../../assets/dino_1.png";

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

export default function AboutUsPage() {
  return (
    <Box sx={{ backgroundColor: "var(--landing-bg, #ffffff)", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box sx={{
        mt: "-100px",
        pt: { xs: "30px", md: "50px" },
        pb: { xs: 8, md: 8 },
        backgroundColor: "#E0F2FE",
        position: "relative",
        overflow: "hidden"
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 900,
                  color: "#1a1a2e",
                  mb: 3,
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  lineHeight: 1.1
                }}
              >
                Our Mission at <Box component="span" sx={{ color: "#25AFF4" }}>Kidaptive</Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: "#334155",
                  lineHeight: 1.8,
                  fontWeight: 400
                }}
              >
                We believe that every child deserves a personalized learning journey. Kidaptive was created to make learning English an exciting, engaging, and adaptive adventure for kids around the world.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: "center" }}>
              <Box
                component="img"
                src={kipImg}
                alt="Kip Mascot"
                sx={{
                  width: "100%",
                  maxWidth: 400,
                  animation: "float 3s ease-in-out infinite",
                  "@keyframes float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-20px)" }
                  }
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Values Section */}
      <Container maxWidth="lg" sx={{ mt: -6, position: "relative", zIndex: 10 }}>
        <Grid container spacing={3}>
          {[
            { title: "Adaptive Learning", icon: "🧠", desc: "Our platform learns how your child learns, adjusting difficulty to keep them engaged without getting frustrated." },
            { title: "Safe Environment", icon: "🛡️", desc: "We provide a 100% kid-safe, ad-free environment designed for learning and exploration." },
            { title: "Fun First", icon: "🎮", desc: "We disguise learning as play. When kids are having fun, they learn faster and retain more." }
          ].map((value, i) => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Card sx={{
                height: "100%",
                borderRadius: 4,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                transition: "transform 0.3s ease",
                "&:hover": { transform: "translateY(-10px)" }
              }}>
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "3rem", mb: 2 }}>{value.icon}</Typography>
                  <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, mb: 2 }}>
                    {value.title}
                  </Typography>
                  <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#64748b" }}>
                    {value.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Story Section */}
      <Container maxWidth="md" sx={{ mt: 10, textAlign: "center", flex: 1 }}>
        <Typography variant="h3" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 900, mb: 4, color: "#1a1a2e" }}>
          The Kidaptive Story
        </Typography>
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", fontSize: "1.1rem", lineHeight: 1.8, mb: 3, textAlign: "left" }}>
          Kidaptive started with a simple observation: standard learning apps treat all children the same. But kids don't learn at the same pace or in the same way. Some need more visual aids, some need more repetition, and some want to race ahead.
        </Typography>
        <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", fontSize: "1.1rem", lineHeight: 1.8, mb: 5, textAlign: "left" }}>
          Our team of educators, developers, and designers came together to build a platform that acts as a digital tutor. By utilizing smart algorithms and game mechanics, we built a world where our mascot, Kip, guides your child through their unique educational pathway.
        </Typography>
        <Box
          component="img"
          src={dinoImg}
          alt="Dino friend"
          sx={{ width: 120, mb: 6, filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }}
        />
      </Container>

      {/* Wave transition into footer */}
      <Box sx={{ mt: "auto" }}>
        <WaveDown from="var(--landing-bg, #ffffff)" to="#1a1a2e" />
      </Box>
    </Box>
  );
}
