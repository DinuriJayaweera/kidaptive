import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import kipImg from "../../../assets/Hi 3.png";
import landingKipBg from "../../../assets/landing_kip.png";
import butterfliesImg from "../../../assets/butterflies.png";
import rocketImg from "../../../assets/rocket.png";
import duckImg from "../../../assets/duck.png";
import dino3 from "../../../assets/5.png";
import dino5 from "../../../assets/6.png";
import dino6 from "../../../assets/3.png";
import dino7 from "../../../assets/7.png";
import dino1Img from "../../../assets/dino_1.png";
import dino2Img from "../../../assets/dino_2.png";
import dino3Img from "../../../assets/dino_3.png";
import dino4Img from "../../../assets/dino_4.png";
import dino5Img from "../../../assets/dino_5.png";
import { useRef, useState, useEffect } from "react";
import { getPublicRatings } from "../../parent/api/ratingApi";
import type { PublicRating } from "../../parent/api/ratingApi";

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
    <Box component="svg" viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg"
      sx={{ display: "block", width: "100%", height: "72px" }}
      preserveAspectRatio="none">
      <rect width="1440" height="70" fill={from} />
      <path fill={to}
        d="M0,35 Q60,0 120,35 Q180,70 240,35 Q300,0 360,35 Q420,70 480,35 Q540,0 600,35 Q660,70 720,35 Q780,0 840,35 Q900,70 960,35 Q1020,0 1080,35 Q1140,70 1200,35 Q1260,0 1320,35 Q1380,70 1440,35 L1440,70 L0,70 Z"
      />
    </Box>
  </Box>
);

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

/* ─── Floating sparkle dot ─── */
const Sparkle = ({ char, top, left, right, delay, size = "1.2rem" }: {
  char: string; top: string; left?: string; right?: string; delay: number; size?: string;
}) => (
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      fontSize: size,
      top,
      left,
      right,
      pointerEvents: "none",
      userSelect: "none",
      opacity: 0.35,
      animation: `sparkleFloat 3.4s ease-in-out ${delay}s infinite`,
      "@keyframes sparkleFloat": {
        "0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: 0.3 },
        "50%": { transform: "translateY(-16px) rotate(25deg)", opacity: 0.6 },
      },
    }}
  >
    {char}
  </Box>
);

/* ─── CSS cloud ─── */
const Cloud = ({ top, left, right, scale = 1, opacity = 0.45, delay = 0 }: {
  top: string; left?: string; right?: string; scale?: number; opacity?: number; delay?: number;
}) => (
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      top,
      left,
      right,
      width: 100 * scale,
      height: 40 * scale,
      borderRadius: "50px",
      background: "rgba(255,255,255,0.55)",
      opacity,
      pointerEvents: "none",
      backdropFilter: "blur(2px)",
      animation: `cloudDrift 8s ease-in-out ${delay}s infinite`,
      "@keyframes cloudDrift": {
        "0%, 100%": { transform: "translateX(0)" },
        "50%": { transform: "translateX(10px)" },
      },
      "&::before": {
        content: '""',
        position: "absolute",
        width: 50 * scale,
        height: 50 * scale,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.55)",
        top: -(20 * scale),
        left: 15 * scale,
      },
      "&::after": {
        content: '""',
        position: "absolute",
        width: 35 * scale,
        height: 35 * scale,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.55)",
        top: -(12 * scale),
        right: 15 * scale,
      },
    }}
  />
);

const roadmapSteps = [
  {
    num: 1,
    emoji: "🔍",
    title: "Placement Test",
    desc: "We find the perfect starting level for your child.",
    color: "#5BC8F5",
    nodeColor: "#0EA5E9",
    img: dino1Img,
  },
  {
    num: 2,
    emoji: "📚",
    title: "Adaptive Lessons",
    desc: "Lessons adapt to your child's progress and learning speed.",
    color: "#A78BFA",
    nodeColor: "#7C3AED",
    img: dino2Img,
  },
  {
    num: 3,
    emoji: "🎮",
    title: "Fun Activities",
    desc: "Children learn through games, stories, and interactive activities.",
    color: "#4ADE80",
    nodeColor: "#16A34A",
    img: dino3Img,
  },
  {
    num: 4,
    emoji: "🏆",
    title: "Rewards & Achievements",
    desc: "Earn exciting rewards and celebrate every milestone.",
    color: "#FBBF24",
    nodeColor: "#D97706",
    img: dino4Img,
  },
  {
    num: 5,
    emoji: "🌟",
    title: "English Champion",
    desc: "Grow into a confident English learner step by step.",
    color: "#F472B6",
    nodeColor: "#DB2777",
    img: dino5Img,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { ref: whoRef, inView: whoInView } = useInView(0.25);
  const { ref: featuresRef, inView: featuresInView } = useInView(0.2);
  const { ref: whyParentsRef, inView: whyParentsInView } = useInView(0.2);
  const { ref: statsRef, inView: statsInView } = useInView(0.3);
  const { ref: testimonialsRef, inView: testimonialsInView } = useInView(0.2);
  const { ref: howItWorksRef, inView: howItWorksInView } = useInView(0.1);

  const [ratings, setRatings] = useState<PublicRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);

  useEffect(() => {
    getPublicRatings()
      .then((data) => setRatings(data))
      .catch(() => setRatings([]))
      .finally(() => setRatingsLoading(false));
  }, []);

  return (
    <Box>
      {/* ═══════════════ HERO ═══════════════ */}
      <Box
        sx={{
          mt: "-100px",
          pt: "100px",
          position: "relative",
          backgroundImage: `url(${landingKipBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          minHeight: { xs: "480px", sm: "560px", md: "650px" },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Container maxWidth="lg" sx={{ flex: 1, display: "flex", alignItems: "center" }}>
          <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: { xs: "center", md: "space-between" }, flexDirection: { xs: "column-reverse", md: "row" }, gap: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: { xs: "center", md: "left" }, maxWidth: { xs: "100%", md: 520 }, pl: { md: "4%" } }}>
              <Typography
                variant="h2"
                sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 900, color: "#1a1a2e", lineHeight: 1.1, fontSize: { xs: "2.8rem", sm: "3.5rem", md: "4.2rem" }, mb: 2, textShadow: "0 2px 12px rgba(255,255,255,0.65)" }}
              >
                Learn English{" "}
                <Box component="span" sx={{ display: "block" }}>
                  with{" "}
                  <Box component="span" sx={{ color: "#4CAF50" }}>Kip!</Box>
                </Box>
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#334155", mb: 2, maxWidth: { xs: "100%", md: 440 }, fontSize: { xs: "1rem", md: "1.15rem" }, lineHeight: 1.8, textShadow: "0 1px 6px rgba(255,255,255,0.5)" }}>
                Fun grammar, writing, and vocabulary lessons designed for young learners. Personalized learning paths that adapt to your child's level and progress.
              </Typography>
            </Box>
            <Box
              component="img"
              src={kipImg}
              alt="Kip waving hello"
              sx={{
                width: { xs: 220, sm: 300, md: 400 },
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
          </Box>
        </Container>
      </Box>

      {/* ═══════════════ WHO ARE YOU? ═══════════════ */}
      <Box ref={whoRef} sx={{ backgroundColor: "var(--landing-bg, #ffffff)", py: { xs: 5, md: 6 } }}>
        <Container maxWidth="md">
          <Box
            sx={{
              opacity: whoInView ? 1 : 0,
              transform: whoInView ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", textAlign: "center", fontWeight: 900, color: "var(--landing-text-main, #1a1a2e)", mb: 0.5 }}>
              WHO ARE YOU?
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", textAlign: "center", color: "var(--landing-text-muted, #777)", mb: 3 }}>
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
                  <Box
                    onClick={() => navigate("/auth/child/pin")}
                    sx={{
                      backgroundColor: "#3ab5e6",
                      color: "#ffffff",
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
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 5 }}>
                  <Box
                    onClick={() => navigate("/auth/login")}
                    sx={{
                      backgroundColor: "var(--landing-bg, #ffffff)",
                      border: "2px solid var(--border-color, #e0e0e0)",
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
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <Box id="how-it-works">
        <WaveUp from="var(--landing-bg, #ffffff)" to="#E0F2FE" />
        <Box
          sx={{
            background: "linear-gradient(160deg, #E0F2FE 0%, #BAE6FD 45%, #E0F7FA 100%)",
            py: { xs: 7, md: 10 },
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* ── Floating background sparkles ── */}
          <Sparkle char="✦" top="6%"  left="3%"  delay={0}   size="1.5rem" />
          <Sparkle char="⭐" top="12%" right="5%" delay={0.8} size="1rem" />
          <Sparkle char="✧" top="28%" left="7%"  delay={1.4} size="1.2rem" />
          <Sparkle char="✦" top="45%" right="3%" delay={0.4} size="0.9rem" />
          <Sparkle char="⭐" top="60%" left="4%"  delay={2.0} size="1.3rem" />
          <Sparkle char="✧" top="75%" right="7%" delay={0.9} size="1rem" />
          <Sparkle char="✦" top="88%" left="8%"  delay={1.7} size="0.9rem" />
          <Sparkle char="⭐" top="92%" right="4%" delay={0.3} size="1.1rem" />

          {/* ── Soft clouds ── */}
          <Cloud top="4%"  right="12%" scale={1.1} opacity={0.4} delay={0} />
          <Cloud top="18%" left="2%"   scale={0.8} opacity={0.35} delay={2} />
          <Cloud top="52%" right="5%"  scale={0.9} opacity={0.3} delay={4} />
          <Cloud top="78%" left="1%"   scale={1.2} opacity={0.38} delay={1} />

          <Container maxWidth="lg">
            <Box
              ref={howItWorksRef}
              sx={{
                opacity: howItWorksInView ? 1 : 0,
                transform: howItWorksInView ? "translateY(0)" : "translateY(40px)",
                transition: "opacity 0.8s ease, transform 0.8s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {/* ── Heading ── */}
              <Typography
                variant="overline"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  display: "block",
                  textAlign: "center",
                  color: "#0369a1",
                  fontWeight: 700,
                  letterSpacing: 4,
                  fontSize: "0.68rem",
                  mb: 0.5,
                }}
              >
                YOUR LEARNING ADVENTURE
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Baloo 2', sans-serif",
                  textAlign: "center",
                  fontWeight: 900,
                  color: "#0c4a6e",
                  fontSize: { xs: "2rem", md: "2.6rem" },
                  lineHeight: 1.15,
                  mb: 1,
                }}
              >
                How Kidaptive Works 🗺️
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  textAlign: "center",
                  color: "#334155",
                  fontSize: { xs: "0.9rem", md: "1rem" },
                  mb: { xs: 5, md: 8 },
                  maxWidth: 500,
                  mx: "auto",
                  lineHeight: 1.7,
                }}
              >
                Every child's journey is unique. Here's how we guide yours.
              </Typography>

              {/* ── Steps ── */}
              <Box sx={{ position: "relative" }}>
                {/* Vertical dashed path line — desktop only */}
                <Box
                  sx={{
                    display: { xs: "none", md: "block" },
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    top: 40,
                    bottom: 40,
                    width: 5,
                    background:
                      "repeating-linear-gradient(to bottom, rgba(3,105,161,0.4) 0px, rgba(3,105,161,0.4) 12px, transparent 12px, transparent 24px)",
                    borderRadius: 4,
                    zIndex: 0,
                  }}
                />

                {roadmapSteps.map((step, i) => (
                  <Box
                    key={step.num}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: i % 2 === 0 ? "row" : "row-reverse" },
                      alignItems: "center",
                      gap: { xs: 2, md: 4 },
                      mb: i < roadmapSteps.length - 1 ? { xs: 4, md: 6 } : 0,
                      position: "relative",
                      zIndex: 1,
                      opacity: howItWorksInView ? 1 : 0,
                      transform: howItWorksInView
                        ? "translateX(0) translateY(0)"
                        : i % 2 === 0
                        ? "translateX(-40px) translateY(20px)"
                        : "translateX(40px) translateY(20px)",
                      transition: `opacity 0.55s ease ${i * 140}ms, transform 0.65s cubic-bezier(0.34,1.56,0.64,1) ${i * 140}ms`,
                    }}
                  >
                    {/* ── Step card ── */}
                    <Box
                      sx={{
                        flex: 1,
                        maxWidth: { md: "calc(50% - 60px)" },
                        background: "#fff",
                        borderRadius: "28px",
                        p: { xs: "20px 20px 22px", md: "28px 28px 30px" },
                        boxShadow: "0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)",
                        border: `2.5px solid ${step.color}35`,
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                        cursor: "default",
                        "&:hover": {
                          transform: "translateY(-10px) scale(1.015)",
                          boxShadow: `0 28px 60px ${step.color}28, 0 4px 16px rgba(0,0,0,0.06)`,
                          borderColor: step.color,
                          "& .step-img": {
                            transform: "scale(1.12) translateY(-6px)",
                            filter: `drop-shadow(0 10px 20px ${step.color}55)`,
                          },
                          "& .node-ring": {
                            opacity: 1,
                            transform: "scale(1)",
                          },
                        },
                      }}
                    >
                      {/* Decorative blob */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: -40,
                          ...(i % 2 === 0 ? { right: -40 } : { left: -40 }),
                          width: 140,
                          height: 140,
                          borderRadius: "50%",
                          background: `${step.color}12`,
                          pointerEvents: "none",
                        }}
                      />

                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: { xs: 2, md: 2.5 } }}>
                        {/* Illustration */}
                        <Box
                          component="img"
                          src={step.img}
                          alt={step.title}
                          className="step-img"
                          sx={{
                            width: { xs: 110, md: 140 },
                            height: { xs: 110, md: 140 },
                            objectFit: "contain",
                            flexShrink: 0,
                            transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), filter 0.4s ease",
                            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.1))",
                            animation: `imgBob${step.num} ${3 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`,
                            [`@keyframes imgBob${step.num}`]: {
                              "0%, 100%": { transform: "translateY(0)" },
                              "50%": { transform: "translateY(-6px)" },
                            },
                          }}
                        />

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {/* Step badge */}
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              background: `${step.color}20`,
                              color: step.nodeColor,
                              borderRadius: "999px",
                              px: 1.4,
                              py: "3px",
                              fontSize: "0.68rem",
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 700,
                              mb: 0.75,
                              letterSpacing: 0.6,
                              textTransform: "uppercase",
                            }}
                          >
                            {step.emoji} Step {step.num}
                          </Box>

                          {/* Title */}
                          <Typography
                            sx={{
                              fontFamily: "'Baloo 2', sans-serif",
                              fontWeight: 800,
                              fontSize: { xs: "1.05rem", md: "1.2rem" },
                              color: "#1a1a2e",
                              lineHeight: 1.2,
                              mb: 0.6,
                            }}
                          >
                            {step.title}
                          </Typography>

                          {/* Description */}
                          <Typography
                            sx={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: { xs: "0.82rem", md: "0.87rem" },
                              color: "#64748b",
                              lineHeight: 1.7,
                            }}
                          >
                            {step.desc}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* ── Checkpoint node ── */}
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: { xs: 60, md: 76 },
                        height: { xs: 60, md: 76 },
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 35% 35%, ${step.color}, ${step.nodeColor})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: { xs: "1.5rem", md: "1.9rem" },
                        color: "#fff",
                        border: "4px solid #fff",
                        zIndex: 2,
                        boxShadow: `0 0 0 6px ${step.color}30, 0 8px 28px ${step.nodeColor}55`,
                        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
                        animation: `nodePulse${step.num} 3s ease-in-out ${i * 0.6}s infinite`,
                        [`@keyframes nodePulse${step.num}`]: {
                          "0%, 100%": {
                            boxShadow: `0 0 0 6px ${step.color}30, 0 8px 28px ${step.nodeColor}55`,
                          },
                          "50%": {
                            boxShadow: `0 0 0 14px ${step.color}15, 0 12px 36px ${step.nodeColor}80`,
                            transform: "scale(1.04)",
                          },
                        },
                        "&:hover": {
                          transform: "scale(1.14) rotate(6deg)",
                          boxShadow: `0 0 0 18px ${step.color}12, 0 16px 40px ${step.nodeColor}90`,
                        },
                      }}
                    >
                      {step.emoji}
                    </Box>

                    {/* Spacer for zigzag balance */}
                    <Box sx={{ flex: 1, maxWidth: { md: "calc(50% - 60px)" }, display: { xs: "none", md: "block" } }} />
                  </Box>
                ))}
              </Box>

              {/* ── Bottom CTA ── */}
              <Box sx={{ textAlign: "center", mt: { xs: 5, md: 7 } }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/auth/child/pin")}
                  sx={{
                    background: "linear-gradient(135deg, #0284C7, #38BDF8)",
                    borderRadius: "50px",
                    textTransform: "none",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    px: 5,
                    py: 1.6,
                    fontSize: "1rem",
                    color: "#fff",
                    boxShadow: "0 6px 24px rgba(2,132,199,0.4)",
                    transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    "&:hover": {
                      transform: "scale(1.08) translateY(-4px)",
                      boxShadow: "0 16px 40px rgba(2,132,199,0.55)",
                    },
                  }}
                >
                  Start Your Journey ✨
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
        <WaveDown from="#E0F7FA" to="var(--landing-feature-bg, #E0F2FE)" />
      </Box>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <Box id="features">
        <Box sx={{ backgroundColor: "var(--landing-feature-bg, #E0F2FE)", py: 6 }}>
          <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 } }}>
            <Box
              ref={featuresRef}
              sx={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? "translateY(0)" : "translateY(40px)",
                transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  display: "block",
                  textAlign: "center",
                  color: "#0369a1",
                  fontWeight: 700,
                  letterSpacing: 3,
                  fontSize: "0.66rem",
                  mb: 0.5,
                }}
              >
                Inside KIDAPTIVE
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Baloo 2', sans-serif",
                  textAlign: "center",
                  fontWeight: 900,
                  color: "var(--landing-text-main, #1a1a2e)",
                  mb: 3.5,
                  fontSize: { xs: "1.6rem", md: "2rem" },
                  lineHeight: 1.2,
                }}
              >
                Everything to master English
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: { xs: 2, sm: 2.5 },
                  justifyContent: "center",
                  alignItems: "stretch",
                }}
              >
                {[
                  {
                    color: "#5BC8F5",
                    textBg: "rgba(0,100,160,0.20)",
                    img: dino3,
                    title: "Grammar Adventures",
                    desc: "Practice grammar with short activities. Lessons adjust to your level as you improve.",
                  },
                  {
                    color: "#FFD44E",
                    textBg: "rgba(130,80,0,0.17)",
                    img: dino5,
                    title: "Sentence Builder",
                    desc: "Build sentences step by step. Kip suggests the next task from your progress.",
                  },
                  {
                    color: "#7DD95A",
                    textBg: "rgba(20,100,0,0.17)",
                    img: dino6,
                    title: "Writing Practice",
                    desc: "Write small sentences and paragraphs. Kip gives feedback to help you grow.",
                  },
                  {
                    color: "#FF9447",
                    textBg: "rgba(140,50,0,0.17)",
                    img: dino7,
                    title: "Vocabulary & Spelling",
                    desc: "Learn new words and spelling. Kip focuses on what you find hard.",
                  },
                ].map((f) => (
                  <Box
                    key={f.title}
                    sx={{
                      flex: "0 0 auto",
                      width: { xs: "78%", sm: "calc(50% - 14px)", md: "calc(25% - 20px)" },
                      maxWidth: 200,
                      minWidth: 160,
                      minHeight: { xs: "auto", md: 300 },
                      display: "flex",
                    }}
                  >
                    <Box
                      sx={{
                        borderRadius: "22px",
                        overflow: "hidden",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.09)",
                        cursor: "pointer",
                        backgroundColor: f.color,
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pt: 3,
                          px: 1.5,
                          pb: 1.5,
                          height: 190,
                          flexShrink: 0,
                          "&:hover .dino-img": {
                            transform: "translateY(-10px) scale(1.10)",
                            filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.18))",
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={f.img}
                          alt={f.title}
                          className="dino-img"
                          sx={{
                            height: "100%",
                            maxHeight: 155,
                            width: "auto",
                            maxWidth: "92%",
                            objectFit: "contain",
                            transition: "transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.28s ease",
                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.12))",
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          backgroundColor: f.textBg,
                          borderRadius: "14px",
                          px: 1.6,
                          pt: 1.1,
                          pb: 1.3,
                          mx: 0.8,
                          mb: 0.8,
                          mt: "auto",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            color: "#fff",
                            fontSize: "0.8rem",
                            mb: 0.35,
                            lineHeight: 1.3,
                          }}
                        >
                          {f.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "'Poppins', sans-serif",
                            color: "rgba(255,255,255,0.9)",
                            fontSize: "0.66rem",
                            lineHeight: 1.55,
                            display: "block",
                          }}
                        >
                          {f.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
        <WaveDown from="var(--landing-feature-bg, #E0F2FE)" to="var(--landing-bg, #ffffff)" />
      </Box>

      {/* ═══════════════ WHY PARENTS ═══════════════ */}
      <Box sx={{ backgroundColor: "var(--landing-bg, #ffffff)", py: 8 }}>
        <Container maxWidth="lg">
          <Box
            ref={whyParentsRef}
            sx={{
              opacity: whyParentsInView ? 1 : 0,
              transform: whyParentsInView ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", textAlign: "center", fontWeight: 900, color: "var(--landing-text-main, #1a1a2e)", mb: 0.5 }}>
              Why Parents Choose Us
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", textAlign: "center", color: "var(--landing-text-muted, #777)", mb: 6 }}>
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
                    backgroundColor: "var(--bg-subtle, #f5f9ff)",
                    border: "1px solid var(--border-color, #e3effe)",
                    boxShadow: "none",
                    transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 16px 36px rgba(58,181,230,0.18)",
                      borderColor: "#3ab5e6",
                      backgroundColor: "var(--bg-hover, #eaf6fd)",
                    },
                  }}>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "var(--bg-hover, #e3effe)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, fontSize: "1.6rem", transition: "transform 0.3s", ".MuiCard-root:hover &": { transform: "scale(1.18) rotate(8deg)" } }}>
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
      <Box sx={{ backgroundColor: "var(--landing-bg, #ffffff)", pb: 8 }}>
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3, md: 0 } }}>
          <Box
            ref={statsRef}
            sx={{
              backgroundColor: "var(--landing-hero-bg, #1a1a2e)",
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
      {(ratingsLoading || ratings.length > 0) && (
        <Box>
          <WaveUp from="var(--landing-bg, #ffffff)" to="var(--landing-testim-bg, #deeefe)" />
          <Box sx={{ backgroundColor: "var(--landing-testim-bg, #deeefe)", py: 7 }}>
            <Container maxWidth="lg">
              <Box
                ref={testimonialsRef}
                sx={{
                  opacity: testimonialsInView ? 1 : 0,
                  transform: testimonialsInView ? "translateY(0)" : "translateY(40px)",
                  transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", textAlign: "center", fontWeight: 900, color: "var(--landing-text-main, #1a1a2e)", mb: 5, fontSize: { xs: "2rem", md: "2.5rem" } }}>
                  Loved By Parents
                </Typography>

                {ratingsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress sx={{ color: "#3ab5e6" }} />
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {ratings.map((review, i) => (
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
                              {review.feedback || "Great experience with Kidaptive!"}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Box sx={{
                                width: 40, height: 40, borderRadius: "50%",
                                backgroundColor: "#c7e9f7",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.1rem", fontWeight: 700, color: "#0369a1",
                              }}>
                                {review.firstName?.[0]?.toUpperCase() ?? "P"}
                              </Box>
                              <Typography variant="body2" fontWeight={600} color="text.secondary">
                                {review.firstName}
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Container>
          </Box>
          <WaveDown from="var(--landing-testim-bg, #deeefe)" to="#1a1a2e" />
        </Box>
      )}
    </Box>
  );
}
