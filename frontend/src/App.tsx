import { useLocation } from "react-router-dom";
import Navbar from "./shared/components/Navbar";
import Footer from "./shared/components/Footer";
import AppRoutes from "./routes/AppRoutes";
import { Box } from "@mui/material";
import { AchievementProvider } from "./features/child/hooks/useAchievementToasts";
import ChildSessionManager from "./app/ChildSessionManager";

const hideShellPaths = ["/auth/", "/parent/", "/child/", "/admin"];

function App() {
  const location = useLocation();
  const hideShell = hideShellPaths.some((p) => location.pathname.startsWith(p));

  return (
    // AchievementProvider sits at the top so any child page can fire toasts
    // by calling `useAchievementToasts().showAchievements(keys)`. When no
    // achievement is being shown, the provider renders nothing visible.
    <AchievementProvider>
      <ChildSessionManager />
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {!hideShell && <Navbar />}
        <Box sx={{ flex: 1 }}>
          <AppRoutes />
        </Box>
        {!hideShell && <Footer />}
      </Box>
    </AchievementProvider>
  );
}

export default App;
