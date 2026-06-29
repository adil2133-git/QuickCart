// src/features/auth/state/authState.ts
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

export type UserRole = "CUSTOMER" | "ADMIN" | "DRIVER" | "STORE";
export type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,

        setUser: (user) => set({ user, isAuthenticated: true }),
        clearUser: () => set({ user: null, isAuthenticated: false }),

        logout: async () => {
          try {
            const { default: api } = await import("../../../api/axios");
            await api.post("/auth/logout");
          } catch {
            // Server call failed — still clear local state
          } finally {
            set({ user: null, isAuthenticated: false });
            window.location.href = "/login";
          }
        },

        hydrate: async () => {
          const existing = get().user;
          try {
            const { default: api } = await import("../../../api/axios");
            const { data } = await api.get<{ user: AuthUser }>("/auth/me", {
              _skipRefresh: true,
            } as never);

            set({ user: data.user, isAuthenticated: true });
            return true;
          } catch {
            if (existing) {
              set({ user: null, isAuthenticated: false });
            }
            return false;
          }
        },
      }),
      {
        name: "quickkart-auth",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);