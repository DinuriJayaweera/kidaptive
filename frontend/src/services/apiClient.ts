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

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token as string);
        }
    });
    failedQueue = [];
};

// Auto-refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (
            error.response?.status === 401 &&
            !original._retry &&
            !original.url?.includes("/auth/refresh") &&
            !original.url?.includes("/login")
        ) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (original.headers && typeof original.headers.set === "function") {
                            original.headers.set("Authorization", `Bearer ${token}`);
                        } else {
                            original.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(original);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const { data } = await api.post("/auth/refresh");
                localStorage.setItem("accessToken", data.accessToken);
                
                if (original.headers && typeof original.headers.set === "function") {
                    original.headers.set("Authorization", `Bearer ${data.accessToken}`);
                } else {
                    original.headers.Authorization = `Bearer ${data.accessToken}`;
                }
                
                processQueue(null, data.accessToken);
                return api(original);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                
                if (window.location.pathname.startsWith("/admin")) {
                    window.location.href = "/auth/admin-login";
                } else {
                    window.location.href = "/auth/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    },
);

export default api;
