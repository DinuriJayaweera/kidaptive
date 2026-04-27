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
    role: "parent" | "child" | "admin" | null;
    loading: boolean;
    login: (user: AuthUser, accessToken: string) => void;
    logout: () => void;
    setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const legacyAvatarMap: Record<string, string> = {
    default: "🦖", dino: "🦕", rocket: "🚀", star: "⭐",
    bear: "🐻", cat: "🐱", dog: "🐶", unicorn: "🦄"
};

function normalizeAvatar(avatar?: string) {
    if (!avatar) return avatar;
    return legacyAvatarMap[avatar] || avatar;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setLoading(false);
            return;
        }

        // 1. Immediately restore from localStorage so avatar/name show instantly
        //    (no flicker, no waiting for the network)
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as AuthUser;
                parsed.avatar = normalizeAvatar(parsed.avatar);
                parsed.avatarUrl = normalizeAvatar(parsed.avatarUrl);
                setUserState(parsed);
            } catch {
                // ignore malformed data
            }
        }

        // 2. Verify the token is still valid and merge fresh data from the server.
        //    getMe() returns the AuthUser shape from /auth/me.
        //    We merge — not replace — so locally saved fields (like avatar) survive
        //    even if the server response doesn't include them.
        getMe()
            .then((freshUser) => {
                setUserState((prev) => {
                    // Merge: server data wins for most fields, but avatar/avatarUrl
                    // from localStorage win if the server omits them (the /auth/me
                    // endpoint now returns avatarUrl, but guard it anyway).
                    const merged: AuthUser = {
                        ...prev,
                        ...freshUser,
                        avatar: normalizeAvatar(freshUser.avatar || freshUser.avatarUrl || prev?.avatar || prev?.avatarUrl),
                        avatarUrl: normalizeAvatar(freshUser.avatarUrl || freshUser.avatar || prev?.avatarUrl || prev?.avatar),
                    };
                    localStorage.setItem("user", JSON.stringify(merged));
                    return merged;
                });
            })
            .catch(() => {
                // Token is invalid — clear everything
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                setUserState(null);
            })
            .finally(() => setLoading(false));
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