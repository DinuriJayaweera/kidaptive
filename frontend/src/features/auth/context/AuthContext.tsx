import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../api/authApi";
import { getMe } from "../api/authApi";

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    role: "parent" | "child" | null;
    loading: boolean;
    login: (user: AuthUser, accessToken: string) => void;
    logout: () => void;
    setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            getMe()
                .then((u) => setUserState(u))
                .catch(() => {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("user");
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = useCallback((user: AuthUser, accessToken: string) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        setUserState(user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUserState(null);
    }, []);

    const setUser = useCallback((user: AuthUser) => {
        localStorage.setItem("user", JSON.stringify(user));
        setUserState(user);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                role: user?.role ?? null,
                loading,
                login,
                logout,
                setUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
