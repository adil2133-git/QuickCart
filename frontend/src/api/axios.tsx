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

// Track if a refresh is already in progress to prevent multiple simultaneous refresh calls
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

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || "";
    const isAuthCheck = originalRequest?.url?.includes("/auth/me");
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    // Silent "am I logged in" check
    if (status === 401 && isAuthCheck) {
      useAuthStore.getState().clearUser();
      return Promise.reject(error);
    }

    // If the refresh call itself failed, log out — no infinite loop
    if (status === 401 && isRefreshCall) {
      useAuthStore.getState().clearUser();
      toast.error("Your session has expired. Please log in again.", {
        id: "session-expired",
        duration: 4000,
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return Promise.reject(error);
    }

    // ── Token expired: attempt silent refresh then retry ──────────────────
    if (status === 401 && !originalRequest._retry) {
      // If a refresh is already running, queue this request until it's done
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))  // retry original after refresh
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call your token refresh endpoint
        await api.post("/auth/refresh");

        processQueue(null);   // let queued requests retry
        return api(originalRequest);  // retry the original failed request

      } catch (refreshError) {
        processQueue(refreshError);  // reject all queued requests
        useAuthStore.getState().clearUser();
        toast.error("Your session has expired. Please log in again.", {
          id: "session-expired",
          duration: 4000,
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
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