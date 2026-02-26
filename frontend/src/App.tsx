import Navbar from "./shared/components/Navbar";
import Footer from "./shared/components/Footer";
import AppRoutes from "./routes/AppRoutes";
import { Box } from "@mui/material";

function App() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box sx={{ flex: 1 }}>
        <AppRoutes />
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
