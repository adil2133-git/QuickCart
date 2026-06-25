import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../features/auth/state/authState";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

const logoutUser = () => {
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
    const status          = error.response?.status;
    const isAuthCheck     = originalRequest?.url?.includes("/auth/me");
    const isRefreshCall   = originalRequest?.url?.includes("/auth/refresh");

    // Silent "am I logged in" check — never redirect, just clear state
    if (status === 401 && isAuthCheck) {
      useAuthStore.getState().clearUser();
      return Promise.reject(error);
    }

    // Refresh call itself failed — refresh token expired or invalid, must log out
    if (status === 401 && isRefreshCall) {
      logoutUser();
      return Promise.reject(error);
    }

    // ── Token expired: attempt silent refresh then retry ──────────────────────
    if (status === 401 && !originalRequest._retry) {

      // Another refresh is already in-flight — queue this request
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

        // ✅ Bug 3 fix: yield to the browser's microtask queue so the new
        // Set-Cookie from the refresh response is fully committed before we
        // replay the original request. Without this, the retry fires with the
        // old (expired) cookie still in the jar and gets another 401.
        await new Promise((resolve) => setTimeout(resolve, 0));

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