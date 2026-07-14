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
            // server call failed — clear local state anyway
          } finally {
            set({ user: null, isAuthenticated: false });
            window.location.href = "/login";
          }
        },

        // called on app load to check whether the session is still valid
        hydrate: async () => {
          const existing = get().user;
          try {
            const { default: api } = await import("../../../api/axios");

            // try /auth/me with the current access token first
            try {
              const { data } = await api.get<{ user: AuthUser }>("/auth/me", {
                _skipRefresh: true,
              } as never);
              set({ user: data.user, isAuthenticated: true });
              return true;
            } catch (firstErr: unknown) {
              const status = (firstErr as { response?: { status?: number } })?.response?.status;

              // access token expired — try a silent refresh, then retry once
              if (status === 401) {
                try {
                  await api.post("/auth/refresh", {}, { _skipAuthRedirect: true } as never);
                  const { data } = await api.get<{ user: AuthUser }>("/auth/me", {
                    _skipRefresh: true,
                  } as never);
                  set({ user: data.user, isAuthenticated: true });
                  return true;
                } catch {
                  // refresh token also expired/missing — genuinely logged out
                  if (existing) {
                    set({ user: null, isAuthenticated: false });
                  }
                  return false;
                }
              }

              // network/server error, not an auth failure — keep any existing session
              return false;
            }
          } catch {
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