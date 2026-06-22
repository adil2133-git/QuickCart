// src/features/auth/state/authState.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "CUSTOMER" | "ADMIN" | "DRIVER" | "STORE";
export type UserStatus =
  | "ACTIVE"
  | "PENDING_APPROVAL"
  | "SUSPENDED"
  | "REJECTED";

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

  /** Populate store after login or after /auth/me resolves */
  setUser: (user: AuthUser) => void;

  /** Wipe store on logout or 401 */
  clearUser: () => void;

  /**
   * Call /auth/me on app startup so a hard-refresh re-hydrates the store
   * without asking the user to log in again (cookie is still valid).
   *
   * Usage: call once inside a top-level <App> useEffect.
   *
   * Returns true if the session is still valid, false otherwise.
   */
  hydrate: () => Promise<boolean>;
}

// Lazy import so we don't create a circular dep between authState ↔ axios
async function fetchMe(): Promise<AuthUser | null> {
  try {
    // Dynamic import avoids circular dependency (axios imports authState)
    const { default: api } = await import("../../../api/axios");
    const { data } = await api.get<{ user: AuthUser }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearUser: () => set({ user: null, isAuthenticated: false }),

      hydrate: async () => {
        // If store already has a user (persisted from last session), trust it
        // but still silently verify the cookie is still valid in the background.
        const existing = get().user;

        const fresh = await fetchMe();
        if (fresh) {
          set({ user: fresh, isAuthenticated: true });
          return true;
        }

        // Cookie is gone / expired — clear stale persisted data
        if (existing) {
          set({ user: null, isAuthenticated: false });
        }
        return false;
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
);