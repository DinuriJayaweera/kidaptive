import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // send cookies for refresh token
});

// Attach access token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (
            error.response?.status === 401 &&
            !original._retry &&
            !original.url?.includes("/auth/refresh") &&
            !original.url?.includes("/auth/login")
        ) {
            original._retry = true;
            try {
                const { data } = await api.post("/auth/refresh");
                localStorage.setItem("accessToken", data.accessToken);
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                window.location.href = "/auth/login";
            }
        }
        return Promise.reject(error);
    },
);

export default api;
