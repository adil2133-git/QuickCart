// src/features/auth/hooks/useLogout.ts
import { useState } from "react";
import { useAuthStore } from "../state/authState";

/**
 * Returns a `logout` function and a loading flag.
 *
 * Usage:
 *   const { logout, isLoggingOut } = useLogout();
 *   <button onClick={logout} disabled={isLoggingOut}>Logout</button>
 */
export function useLogout() {
  const storeLogout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await storeLogout(); // clears state + redirects — this won't return
  };

  return { logout, isLoggingOut };
}