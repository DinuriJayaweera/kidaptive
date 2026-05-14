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

export default function PrivacyPolicyPage() {
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
            Privacy Policy
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
            1. Introduction
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            At Kidaptive, we take your privacy and the privacy of your children very seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use the Kidaptive educational platform. Please read this privacy policy carefully to understand our practices regarding your information.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            2. Children's Privacy & COPPA Compliance
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 2, lineHeight: 1.8 }}>
            Kidaptive is designed primarily for children, and we comply fully with the Children's Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13 without verified parental consent.
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            <strong>What we collect from children:</strong> We only collect non-identifiable usage data, such as quiz scores, placement test results, in-game achievements, and learning progress. This data is strictly used to adapt the difficulty of our quizzes, track educational progress, and provide comprehensive reports to the linked parent account. We do not ask children to provide their real names, emails, or locations.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            3. Information We Collect from Parents
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 2, lineHeight: 1.8 }}>
            When a parent or guardian creates an account, we may collect the following personal information:
          </Typography>
          <Typography component="ul" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8, pl: 3 }}>
            <li><strong>Account details:</strong> Email address, name, and secure password hashes.</li>
            <li><strong>Child profiles:</strong> Avatars, nicknames, and age groups assigned to the children.</li>
            <li><strong>Contact details:</strong> Information provided when contacting customer support.</li>
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            4. How We Use the Information
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 2, lineHeight: 1.8 }}>
            The data we collect is used exclusively for the core functionalities of the Kidaptive platform:
          </Typography>
          <Typography component="ul" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8, pl: 3 }}>
            <li>To dynamically adapt learning algorithms based on a child's performance.</li>
            <li>To generate detailed progress reports and dashboards for parents.</li>
            <li>To send account verification emails, password resets, and critical system notifications.</li>
            <li>To improve our educational content and user experience.</li>
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            5. Data Sharing and Disclosure
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            <strong>We do not sell, trade, or rent personal information to third parties.</strong> Kidaptive is ad-free, meaning no third-party advertisers will ever track you or your children on our platform. We may only disclose your information to comply with legal obligations, protect our rights, or with trusted service providers who assist us in operating our platform (under strict confidentiality agreements).
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            6. Parental Rights & Data Deletion
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            Parents have complete control over their accounts and their children's profiles. You can review, modify, or permanently delete a child's profile and all associated data at any time through the Parent Dashboard. If you wish to delete your parent account entirely, please contact us.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" sx={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#1a1a2e", mb: 2 }}>
            7. Contact Us
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: "'Poppins', sans-serif", color: "#475569", mb: 4, lineHeight: 1.8 }}>
            If you have questions or comments about this Privacy Policy, please contact us via our Contact Us page or email us directly at <strong>kidaptive.app@gmail.com</strong>.
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
