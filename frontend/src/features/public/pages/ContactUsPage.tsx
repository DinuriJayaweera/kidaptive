import { Box, Container, Typography, Grid, Card, CardContent, TextField, Button, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import api from "../../../services/apiClient";
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import kipImg from "../../../assets/Hi 2.png";
import rocketImg from "../../../assets/rocket.png";

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

export default function ContactUsPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      await api.post("/contact", formData);
      setShowSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (error: any) {
      console.error("Failed to send contact message", error);
      setErrorMsg(error.response?.data?.message || "Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: "var(--landing-bg, #ffffff)", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box sx={{
        mt: "-100px",
        pt: { xs: "30px", md: "50px" },
        pb: { xs: 8, md: 10 },
        background: "linear-gradient(160deg, #E0F2FE 0%, #BAE6FD 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Floating Rocket Decoration */}
        <Box 
          component="img" 
          src={rocketImg} 
          alt="Rocket" 
          sx={{ 
            position: "absolute", 
            top: "15%", 
            right: "5%", 
            width: { xs: 80, md: 120 }, 
            opacity: 0.8,
            animation: "fly 8s ease-in-out infinite",
            "@keyframes fly": {
              "0%, 100%": { transform: "translateY(0) rotate(10deg)" },
              "50%": { transform: "translateY(-40px) rotate(20deg)" }
            }
          }} 
        />
        
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
          <Typography 
            variant="h2" 
            align="center"
            sx={{ 
              fontFamily: "'Baloo 2', sans-serif", 
              fontWeight: 900, 
              color: "#1a1a2e", 
              mb: 2,
              mt: { xs: 6, md: 8 },
              fontSize: { xs: "2.5rem", md: "4rem" },
            }}
          >
            Get in <Box component="span" sx={{ color: "#25AFF4" }}>Touch</Box>
          </Typography>
          <Typography 
            variant="h6" 
            align="center"
            sx={{ 
              fontFamily: "'Poppins', sans-serif", 
              color: "#475569", 
              maxWidth: 600,
              mx: "auto",
              mb: 6,
              fontWeight: 400
            }}
          >
            Have questions about Kidaptive? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </Typography>

          <Grid container spacing={4} alignItems="stretch">
            {/* Contact Info Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ 
                height: "100%", 
                borderRadius: 5, 
                backgroundColor: "#25AFF4",
                color: "#fff",
                boxShadow: "0 20px 40px rgba(37, 175, 244, 0.25)",
                position: "relative",
                overflow: "hidden"
              }}>
                <Box sx={{ position: "absolute", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                <Box sx={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                
                <CardContent sx={{ p: { xs: 4, md: 5 }, position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
                  <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, mb: 5 }}>
                    Contact Information
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <EmailIcon sx={{ fontSize: 24, color: "#fff" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem" }}>Email Us</Typography>
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#E0F2FE", fontSize: "0.95rem" }}>kidaptive.app@gmail.com</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <LocationOnIcon sx={{ fontSize: 24, color: "#fff" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem" }}>Location</Typography>
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#E0F2FE", fontSize: "0.95rem" }}>Kidaptive HQ<br/>EdTech City, ED 10101</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <AccessTimeIcon sx={{ fontSize: 24, color: "#fff" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem" }}>Working Hours</Typography>
                      <Typography sx={{ fontFamily: "'Poppins', sans-serif", color: "#E0F2FE", fontSize: "0.95rem" }}>Mon - Fri: 9:00 AM - 5:00 PM</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: "auto", pt: 2, display: "flex", justifyContent: "center" }}>
                    <Box 
                      component="img" 
                      src={kipImg} 
                      alt="Kip waving" 
                      sx={{ 
                        width: 160, 
                        filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.25))",
                        animation: "wave 2.5s ease-in-out infinite",
                        transformOrigin: "bottom center",
                        "@keyframes wave": {
                          "0%, 100%": { transform: "rotate(-4deg)" },
                          "50%": { transform: "rotate(4deg)" }
                        }
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Form Card */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ 
                height: "100%", 
                borderRadius: 5, 
                boxShadow: "0 15px 35px rgba(0,0,0,0.06)",
                p: { xs: 2, md: 3 }
              }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 4 }}>
                    Send us a Message
                  </Typography>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField 
                          fullWidth 
                          label="Your Name" 
                          variant="outlined" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              borderRadius: 3, 
                              backgroundColor: "#f8fafc",
                              fontFamily: "'Poppins', sans-serif"
                            } 
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField 
                          fullWidth 
                          label="Email Address" 
                          type="email"
                          variant="outlined" 
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              borderRadius: 3, 
                              backgroundColor: "#f8fafc",
                              fontFamily: "'Poppins', sans-serif"
                            } 
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField 
                          fullWidth 
                          label="Message" 
                          multiline
                          rows={6}
                          variant="outlined" 
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              borderRadius: 3, 
                              backgroundColor: "#f8fafc",
                              fontFamily: "'Poppins', sans-serif"
                            } 
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button 
                          type="submit" 
                          variant="contained" 
                          disabled={isSubmitting}
                          endIcon={!isSubmitting && <SendIcon />}
                          sx={{ 
                            mt: 2,
                            py: 1.8,
                            px: 5,
                            borderRadius: 8,
                            backgroundColor: "#25AFF4",
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: "1.05rem",
                            textTransform: "none",
                            boxShadow: "0 8px 20px rgba(37, 175, 244, 0.3)",
                            transition: "all 0.3s ease",
                            '&:hover': {
                              backgroundColor: "#0284C7",
                              transform: "translateY(-3px)",
                              boxShadow: "0 12px 25px rgba(37, 175, 244, 0.4)",
                            }
                          }}
                        >
                          {isSubmitting ? "Sending..." : "Send Message"}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Spacer to push wave to bottom if needed */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Wave transition into footer */}
      <Box sx={{ mt: "auto" }}>
        <WaveDown from="#BAE6FD" to="#1a1a2e" />
      </Box>

      <Snackbar 
        open={showSuccess} 
        autoHideDuration={6000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%', borderRadius: 3, fontFamily: "'Poppins', sans-serif", fontSize: "1rem", alignItems: "center" }}>
          Message sent successfully! We'll get back to you soon.
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!errorMsg} 
        autoHideDuration={6000} 
        onClose={() => setErrorMsg("")}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMsg("")} severity="error" sx={{ width: '100%', borderRadius: 3, fontFamily: "'Poppins', sans-serif", fontSize: "1rem", alignItems: "center" }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
