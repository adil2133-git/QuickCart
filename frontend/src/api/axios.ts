import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../features/auth/state/authState";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(undefined);
  });
  failedQueue = [];
};

const logoutUser = () => {
  if (window.location.pathname === "/login") return;

  useAuthStore.getState().clearUser();
  toast.error("Your session has expired. Please log in again.", {
    id: "session-expired",
    duration: 4000,
  });
  setTimeout(() => {
    window.location.href = "/login";
  }, 500);
};

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    // The refresh call itself failed — refresh token is expired/invalid
    if (status === 401 && isRefreshCall) {
      isRefreshing = false;
      processQueue(error);
      logoutUser();
      return Promise.reject(error);
    }

    // _skipRefresh is set on requests that should NOT trigger a silent refresh
    // on 401 — specifically the hydrate() call to /auth/me on app startup.
    // A 401 there just means "no session yet", not "token expired".
    if (status === 401 && originalRequest?._skipRefresh) {
      return Promise.reject(error);
    }

    // ── Token expired on a real API call: silent refresh then retry ───────────
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        logoutUser();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403) {
      toast.error("You don't have permission to access this.", {
        id: "forbidden",
        duration: 3000,
      });
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;