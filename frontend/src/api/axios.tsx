// src/api/axios.ts
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

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "";
    const isAuthCheck = error.config?.url?.includes("/auth/me");

    // Silent "am I logged in" check — never toast or redirect from this one.
    // Let the caller (hydrate()) handle the null/failure quietly.
    if (status === 401 && isAuthCheck) {
      useAuthStore.getState().clearUser();
      return Promise.reject(error);
    }

    if (status === 401 && message === "Access token expired") {
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

    if (status === 401) {
      useAuthStore.getState().clearUser();
      toast.error("Please log in to continue.", {
        id: "unauthorized",
        duration: 3000,
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return Promise.reject(error);
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