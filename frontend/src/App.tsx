import { useLocation } from "react-router-dom";
import Navbar from "./shared/components/Navbar";
import Footer from "./shared/components/Footer";
import AppRoutes from "./routes/AppRoutes";
import { Box } from "@mui/material";

const hideShellPaths = ["/auth/", "/parent/", "/child/", "/admin"];

function App() {
  const location = useLocation();
  const hideShell = hideShellPaths.some((p) => location.pathname.startsWith(p));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {!hideShell && <Navbar />}
      <Box sx={{ flex: 1 }}>
        <AppRoutes />
      </Box>
      {!hideShell && <Footer />}
    </Box>
  );
}

export default App;
