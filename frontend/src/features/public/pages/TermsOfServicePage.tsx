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

export default function TermsOfServicePage() {
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
            Terms of Service
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", fontWeight: 400 }}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Typography>
        </Container>
      </Box>

      {/* Content Section */}
      <Container maxWidth="md" sx={{ mt: -6, position: "relative", zIndex: 2, mb: 10 }}>
        <Paper sx={{ p: { xs: 4, md: 8 }, borderRadius: 5, boxShadow: "0 15px 35px rgba(0,0,0,0.06)" }}>
          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            Welcome to Kidaptive! By accessing or using our website, applications, or educational services, you (the "Parent," "Guardian," or "User") agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services. These terms constitute a legally binding agreement between you and Kidaptive.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            2. Account Registration & Parental Responsibility
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 2, lineHeight: 1.8 }}>
            Kidaptive is an educational platform intended for children. However, all accounts must be created and managed by an adult over the age of 18.
          </Typography>
          <Typography component="ul" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8, pl: 3 }}>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You must provide accurate and complete information when registering an account.</li>
            <li>You agree to monitor and supervise your child's use of the Kidaptive platform.</li>
            <li>You are responsible for all activities that occur under your account, including actions taken by children using sub-profiles created by you.</li>
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            3. Intellectual Property Rights
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            All content, features, and functionality on Kidaptive, including but not limited to text, graphics, logos, mascots, educational algorithms, and software, are the exclusive property of Kidaptive and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or commercially exploit any of the material on our platform without our prior written consent.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            4. Acceptable Use Policy
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 2, lineHeight: 1.8 }}>
            You agree not to use the Kidaptive platform for any unlawful purpose or any purpose prohibited under this clause. You agree not to:
          </Typography>
          <Typography component="ul" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8, pl: 3 }}>
            <li>Attempt to reverse engineer or decompile any software contained on Kidaptive.</li>
            <li>Interfere with or disrupt the security, stability, or performance of the platform.</li>
            <li>Use automated scripts, bots, or scrapers to access or collect data from Kidaptive.</li>
            <li>Use the platform to harass, abuse, or harm another person.</li>
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            5. Termination of Service
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            We reserve the right to suspend or terminate your account and your access to the Kidaptive platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service. Upon termination, your right to use the platform will immediately cease.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            6. Limitation of Liability
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            In no event shall Kidaptive, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            7. Changes to Terms
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any material changes by posting the new Terms on this page. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
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
