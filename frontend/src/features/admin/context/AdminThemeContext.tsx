import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { getAdminProfile } from "../api/adminProfileApi";

interface AdminThemeState {
    /** The current theme mode (applied live on toggle) */
    mode: "light" | "dark";
    /** Toggle the theme — immediately applies to the DOM */
    toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeState>({
    mode: "light",
    toggleTheme: () => {},
});

export function AdminThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<"light" | "dark">(() => {
        return (localStorage.getItem("adminTheme") as "light" | "dark") || "light";
    });

    // On mount, fetch the admin profile to get the saved theme from the backend
    useEffect(() => {
        getAdminProfile()
            .then((profile) => {
                const saved = (profile.themePreference as "light" | "dark") || "light";
                setMode(saved);
                document.documentElement.setAttribute("data-theme", saved);
                localStorage.setItem("adminTheme", saved);
            })
            .catch(() => {
                // Fall back to localStorage value (already set in initial state)
            });
    }, []);

    // Apply theme to DOM whenever mode changes
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", mode);
        localStorage.setItem("adminTheme", mode);
    }, [mode]);

    const toggleTheme = useCallback(() => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    }, []);

    return (
        <AdminThemeContext.Provider value={{ mode, toggleTheme }}>
            {children}
        </AdminThemeContext.Provider>
    );
}

export function useAdminTheme() {
    return useContext(AdminThemeContext);
}
