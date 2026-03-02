import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import kipImg from "../../../assets/images/kip_a.png";
import butterfliesImg from "../../../assets/images/butterflies.png";
import rocketImg from "../../../assets/images/rocket.png";
import duckImg from "../../../assets/images/duck.png";
import { useRef, useState, useEffect } from "react";

/* ─── Fires once when element enters viewport ─── */
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { setInView(entry.isIntersecting); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Counts up from 0 to target when active ─── */
function useCountUp(target: number, duration: number, active: boolean, decimals = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) { setCount(0); return; }
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(parseFloat(current.toFixed(decimals)));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration, decimals]);
  return count;
}

/* ─── Individual animated stat ─── */
function StatItem({ target, suffix, label, delay, active, decimals = 0 }: {
  target: number; suffix: string; label: string; delay: number; active: boolean; decimals?: number;
}) {
  const count = useCountUp(target, 1400, active, decimals);
  return (
    <Box sx={{
      textAlign: "center",
      opacity: active ? 1 : 0,
      transform: active ? "scale(1) translateY(0)" : "scale(0.4) translateY(30px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
    }}>
      <Typography sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, fontWeight: 900, color: "#f5c842", lineHeight: 1.1, fontFamily: "'Baloo 2', sans-serif" }}>
        {decimals > 0 ? count.toFixed(decimals) : count}{suffix}
      </Typography>
      <Typography variant="body2" sx={{ color: "#aaa", mt: 0.5, fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
}

/* ─── Static wave: bumps UP ─── */
const WaveUp = ({ from, to }: { from: string; to: string }) => (
  <Box sx={{ lineHeight: 0, overflow: "hidden", height: 70, mt: "-2px", mb: "-1px" }}>
    <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "72px" }}
      preserveAspectRatio="none">
      <rect width="1440" height="70" fill={from} />
      <path fill={to}
        d="M0,35 Q60,0 120,35 Q180,70 240,35 Q300,0 360,35 Q420,70 480,35 Q540,0 600,35 Q660,70 720,35 Q780,0 840,35 Q900,70 960,35 Q1020,0 1080,35 Q1140,70 1200,35 Q1260,0 1320,35 Q1380,70 1440,35 L1440,70 L0,70 Z"
      />
    </svg>
  </Box>
);

/* ─── Static wave: bumps DOWN ─── */
const WaveDown = ({ from, to }: { from: string; to: string }) => (
  <Box sx={{ lineHeight: 0, overflow: "hidden", height: 70, mt: "-1px", mb: "-2px" }}>
    <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "72px" }}
      preserveAspectRatio="none">
      <rect width="1440" height="70" fill={to} />
      <path fill={from}
        d="M0,35 Q60,70 120,35 Q180,0 240,35 Q300,70 360,35 Q420,0 480,35 Q540,70 600,35 Q660,0 720,35 Q780,70 840,35 Q900,0 960,35 Q1020,70 1080,35 Q1140,0 1200,35 Q1260,70 1320,35 Q1380,0 1440,35 L1440,0 L0,0 Z"
      />
    </svg>
  </Box>
);

/* ─── Star Rating ─── */
const Stars = ({ rating }: { rating: number }) => (
  <Box sx={{ display: "flex", gap: 0.3, mb: 1 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Typography key={s} sx={{ color: s <= Math.floor(rating) ? "#f5a623" : "#ddd", fontSize: "1.1rem" }}>
        ★
      </Typography>
    ))}
  </Box>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { ref: whoRef, inView: whoInView } = useInView(0.25);
  const { ref: featuresRef, inView: featuresInView } = useInView(0.2);
  const { ref: whyParentsRef, inView: whyParentsInView } = useInView(0.2);
  const { ref: statsRef, inView: statsInView } = useInView(0.3);
  const { ref: testimonialsRef, inView: testimonialsInView } = useInView(0.2);

  return (
    <Box>
      {/* ═══════════════ HERO ═══════════════ */}
      <Box sx={{ backgroundColor: "#c8e6f7" }}>
        {/* Wave that connects navbar (#3ab5e6) → hero (#c8e6f7) — scrolls with page */}
        <WaveDown from="#3ab5e6" to="#c8e6f7" />
        <Container maxWidth="lg">
          <Grid container alignItems="center" sx={{ minHeight: { xs: "auto", md: "420px" }, py: { xs: 6, md: 5 } }} spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h2"
                sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 900, color: "#1a1a2e", lineHeight: 1.15, fontSize: { xs: "2.1rem", sm: "2.5rem", md: "3.2rem" }, mb: 2 }}
              >
                Learn English{" "}
                <Box component="span" sx={{ display: "block" }}>
                  with{" "}
                  <Box component="span" sx={{ color: "#86DB8C" }}>Kip!</Box>
                </Box>
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#444", mb: 4, maxWidth: 420, lineHeight: 1.8 }}>
                Fun grammar, writing, and vocabulary lessons designed for young learners. Personalized learning paths that adapt to your child's level and progress.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  const el = whoRef.current;
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 90;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }}
                sx={{
                  backgroundColor: "#3ab5e6",
                  borderRadius: "50px",
                  textTransform: "none",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  boxShadow: "0 4px 20px rgba(58,181,230,0.45)",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  animation: "btnGlow 2.4s ease-in-out infinite",
                  "@keyframes btnGlow": {
                    "0%, 100%": { boxShadow: "0 4px 20px rgba(58,181,230,0.45)" },
                    "50%": { boxShadow: "0 6px 32px rgba(58,181,230,0.75)" },
                  },
                  "&:hover": {
                    backgroundColor: "#1ea0d0",
                    transform: "scale(1.13) translateY(-4px)",
                    boxShadow: "0 14px 36px rgba(58,181,230,0.65)",
                    animation: "none",
                  },
                  "&:active": { transform: "scale(0.95)", transition: "all 0.1s" },
                }}
              >
                Get Started!
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: "center" }}>
              <Box
                component="img"
                src={kipImg}
                alt="Kip the dinosaur"
                sx={{
                  width: { xs: 200, sm: 260, md: 380 },
                  maxWidth: "100%",
                  filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.15))",
                  animation: "kipFloat 3.2s ease-in-out infinite",
                  "@keyframes kipFloat": {
                    "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
                    "40%": { transform: "translateY(-18px) rotate(2deg)" },
                    "70%": { transform: "translateY(-10px) rotate(-1deg)" },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Container>
        <WaveDown from="#c8e6f7" to="#ffffff" />
      </Box>

      {/* ═══════════════ WHO ARE YOU? ═══════════════ */}
      <Box ref={whoRef} sx={{ backgroundColor: "#fff", py: 8 }}>
        <Container maxWidth="md">
          <Box
            sx={{
              opacity: whoInView ? 1 : 0,
              transform: whoInView ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", textAlign: "center", fontWeight: 900, color: "#1a1a2e", mb: 0.5 }}>
              WHO ARE YOU?
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", textAlign: "center", color: "#777", mb: 5 }}>
              Select your profile to continue your journey
            </Typography>

            <Box sx={{ position: "relative" }}>
              <Box
                component="img"
                src={butterfliesImg}
                alt="Butterflies"
                sx={{
                  position: "absolute",
                  left: { xs: -10, md: -60 },
                  top: "50%",
                  width: { xs: 80, md: 120 },
                  transform: "translateY(-50%)",
                  display: { xs: "none", sm: "block" },
                  animation: "flutter 2.2s ease-in-out infinite",
                  "@keyframes flutter": {
                    "0%, 100%": { transform: "translateY(-50%) rotate(0deg)" },
                    "25%": { transform: "translateY(-58%) rotate(12deg)" },
                    "75%": { transform: "translateY(-42%) rotate(-12deg)" },
                  },
                }}
              />
              <Box
                component="img"
                src={rocketImg}
                alt="Rocket"
                sx={{
                  position: "absolute",
                  right: { xs: -10, md: -60 },
                  top: "50%",
                  width: { xs: 80, md: 120 },
                  transform: "translateY(-50%)",
                  display: { xs: "none", sm: "block" },
                  animation: "rocketFly 1.8s ease-in-out infinite",
                  "@keyframes rocketFly": {
                    "0%, 100%": { transform: "translateY(-50%) rotate(-10deg)" },
                    "50%": { transform: "translateY(-62%) rotate(5deg)" },
                  },
                }}
              />

              <Grid container spacing={3} justifyContent="center">
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Card
                    onClick={() => navigate("/auth/child/pin")}
                    sx={{
                      backgroundColor: "#3ab5e6",
                      color: "#fff",
                      borderRadius: 5,
                      textAlign: "center",
                      py: 4,
                      cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(58,181,230,0.35)",
                      transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      "@keyframes iconPop": {
                        "0%": { transform: "scale(1) rotate(0deg)" },
                        "30%": { transform: "scale(1.3) rotate(-8deg)" },
                        "60%": { transform: "scale(0.9) rotate(5deg)" },
                        "100%": { transform: "scale(1) rotate(0deg)" },
                      },
                      "&:hover": {
                        transform: "scale(1.07) translateY(-8px)",
                        boxShadow: "0 22px 44px rgba(58,181,230,0.45)",
                        "& .card-icon": { animation: "iconPop 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both" },
                      },
                      "&:active": { transform: "scale(0.97)", transition: "all 0.1s" },
                    }}
                  >
                    <CardContent>
                      <Typography className="card-icon" sx={{ fontSize: "2.5rem", mb: 1, display: "block" }}>👦🏻👧🏻</Typography>
                      <Typography variant="h6" fontWeight={700}>I'm a child</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.85 }}>Start your adventure!</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 5 }}>
                  <Card
                    onClick={() => navigate("/auth/login")}
                    sx={{
                      backgroundColor: "#fff",
                      border: "2px solid #e0e0e0",
                      borderRadius: 5,
                      textAlign: "center",
                      py: 4,
                      cursor: "pointer",
                      transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      "@keyframes iconPop": {
                        "0%": { transform: "scale(1) rotate(0deg)" },
                        "30%": { transform: "scale(1.3) rotate(8deg)" },
                        "60%": { transform: "scale(0.9) rotate(-5deg)" },
                        "100%": { transform: "scale(1) rotate(0deg)" },
                      },
                      "&:hover": {
                        transform: "scale(1.07) translateY(-8px)",
                        borderColor: "#3ab5e6",
                        boxShadow: "0 22px 44px rgba(58,181,230,0.2)",
                        "& .card-icon": { animation: "iconPop 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both" },
                      },
                      "&:active": { transform: "scale(0.97)", transition: "all 0.1s" },
                    }}
                  >
                    <CardContent>
                      <Typography className="card-icon" sx={{ fontSize: "2.5rem", mb: 1, display: "block" }}>🧑🏻‍👩🏻‍👦🏻</Typography>
                      <Typography variant="h6" fontWeight={700} color="#4caf50">I'm a Parent</Typography>
                      <Typography variant="caption" color="text.secondary">Monitor progress</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <Box>
        <WaveUp from="#ffffff" to="#f5c842" />
        <Box sx={{ backgroundColor: "#f5c842", py: 6 }}>
          <Container maxWidth="lg">
            <Box
              ref={featuresRef}
              sx={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? "translateY(0)" : "translateY(40px)",
                transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <Typography variant="overline" sx={{ fontFamily: "'Poppins', sans-serif", display: "block", textAlign: "center", color: "#7a5800", fontWeight: 700, letterSpacing: 2 }}>
                Inside KIDAPTIVE
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", textAlign: "center", fontWeight: 900, color: "#1a1a2e", mb: 5 }}>
                Everything to master English
              </Typography>
              <Grid container spacing={3}>
                {[
                  { icon: "📚", title: "Grammar Adventures", desc: "Practice grammar with short activities. Lessons adjust to your level as you improve." },
                  { icon: "📚", title: "Sentence Builder", desc: "Build sentences step by step. Kip suggests the next task from your progress." },
                  { icon: "✍️", title: "Writing Practice", desc: "Write small sentences and paragraphs. Kip gives feedback to help you grow." },
                  { icon: "🔤", title: "Vocabulary & Spelling", desc: "Learn new words and spelling. Kip focuses on what you find hard." },
                ].map((f) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={f.title}>
                    <Card sx={{
                      borderRadius: 4,
                      p: 1,
                      height: "100%",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      cursor: "pointer",
                      "@keyframes iconSpin": {
                        "0%": { transform: "rotate(0deg) scale(1)" },
                        "25%": { transform: "rotate(-15deg) scale(1.25)" },
                        "75%": { transform: "rotate(15deg) scale(1.15)" },
                        "100%": { transform: "rotate(0deg) scale(1)" },
                      },
                      "&:hover": {
                        transform: "translateY(-10px) scale(1.03)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.14)",
                        "& .feat-icon": { animation: "iconSpin 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both" },
                      },
                    }}>
                      <CardContent>
                        <Typography className="feat-icon" sx={{ fontSize: "2rem", mb: 1, display: "block" }}>{f.icon}</Typography>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{f.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Container>
        </Box>
        <WaveDown from="#f5c842" to="#ffffff" />
      </Box>

      {/* ═══════════════ WHY PARENTS ═══════════════ */}
      <Box sx={{ backgroundColor: "#fff", py: 8 }}>
        <Container maxWidth="lg">
          <Box
            ref={whyParentsRef}
            sx={{
              opacity: whyParentsInView ? 1 : 0,
              transform: whyParentsInView ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", textAlign: "center", fontWeight: 900, color: "#1a1a2e", mb: 0.5 }}>
              Why Parents Choose Us
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", textAlign: "center", color: "#777", mb: 6 }}>
              We prioritize education, safety, and transparency above all else.
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {[
                { icon: "🎯", title: "Personalized Path", desc: "We use smart learning to adjust lessons to your child's level, focusing more on areas they find difficult." },
                { icon: "🛡️", title: "Kid-Safe Environment", desc: "Ad-free, COPPA-compliant, and child-safe. A calm space designed for kids to explore and learn." },
                { icon: "📊", title: "Progress Reports", desc: "Summaries of your child's achievements, strengths, and areas to improve." },
              ].map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
                  <Card sx={{
                    borderRadius: 4,
                    p: 1,
                    height: "100%",
                    backgroundColor: "#f5f9ff",
                    border: "1px solid #e3effe",
                    boxShadow: "none",
                    transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 16px 36px rgba(58,181,230,0.18)",
                      borderColor: "#3ab5e6",
                      backgroundColor: "#eaf6fd",
                    },
                  }}>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#e3effe", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, fontSize: "1.6rem", transition: "transform 0.3s", ".MuiCard-root:hover &": { transform: "scale(1.18) rotate(8deg)" } }}>
                        {item.icon}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* ═══════════════ STATS ═══════════════ */}
      <Box sx={{ backgroundColor: "#fff", pb: 8 }}>
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3, md: 0 } }}>
          <Box
            ref={statsRef}
            sx={{
              backgroundColor: "#1a1a2e",
              borderRadius: { xs: 4, md: 6 },
              py: { xs: 4, md: 5 },
              px: { xs: 2, md: 6 },
              position: "relative",
              opacity: statsInView ? 1 : 0,
              transform: statsInView ? "translateY(0)" : "translateY(50px)",
              transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <Grid container spacing={2} justifyContent="center">
              {([
                { target: 100, suffix: "+", label: "Kids Learning", delay: 0, decimals: 0 },
                { target: 50, suffix: "+", label: "Happy Parents", delay: 150, decimals: 0 },
                { target: 4.8, suffix: "/5", label: "Average Rating", delay: 300, decimals: 1 },
                { target: 50, suffix: "+", label: "Lessons", delay: 450, decimals: 0 },
              ] as const).map((stat) => (
                <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                  <StatItem
                    target={stat.target}
                    suffix={stat.suffix}
                    label={stat.label}
                    delay={stat.delay}
                    decimals={stat.decimals}
                    active={statsInView}
                  />
                </Grid>
              ))}
            </Grid>
            <Box
              component="img"
              src={duckImg}
              alt="Duck"
              sx={{
                position: "absolute",
                bottom: -8,
                right: { xs: 16, md: 32 },
                width: { xs: 50, md: 70 },
                zIndex: 2,
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <Box>
        <WaveUp from="#ffffff" to="#deeefe" />
        <Box sx={{ backgroundColor: "#deeefe", py: 7 }}>
          <Container maxWidth="lg">
            <Box
              ref={testimonialsRef}
              sx={{
                opacity: testimonialsInView ? 1 : 0,
                transform: testimonialsInView ? "translateY(0)" : "translateY(40px)",
                transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", textAlign: "center", fontWeight: 900, color: "#1a1a2e", mb: 5, fontSize: { xs: "2rem", md: "2.5rem" } }}>
                Loved By Parents
              </Typography>
              <Grid container spacing={3}>
                {[
                  { rating: 5, name: "Lorem Ipsum" },
                  { rating: 4.5, name: "Lorem Ipsum" },
                  { rating: 4, name: "Lorem Ipsum" },
                ].map((review, i) => (
                  <Grid size={{ xs: 12, md: 4 }} key={i}>
                    <Card sx={{
                      borderRadius: 4,
                      p: 1,
                      height: "100%",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                      transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      "&:hover": {
                        transform: "translateY(-8px) scale(1.02)",
                        boxShadow: "0 18px 36px rgba(0,0,0,0.13)",
                      },
                    }}>
                      <CardContent>
                        <Stars rating={review.rating} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box sx={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                            👤
                          </Box>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            {review.name}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Container>
        </Box>
        <WaveDown from="#deeefe" to="#1a1a2e" />
      </Box>
    </Box>
  );
}