import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { theme } from "../../shared/theme/theme";
import { AuthProvider } from "../../features/auth/context/AuthContext";

export function renderWithProviders(ui: React.ReactElement) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(
        <GoogleOAuthProvider clientId="test-client-id">
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <BrowserRouter>
                        <AuthProvider>
                            {ui}
                        </AuthProvider>
                    </BrowserRouter>
                </ThemeProvider>
            </QueryClientProvider>
        </GoogleOAuthProvider>
    );
}