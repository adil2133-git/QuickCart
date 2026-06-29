// src/features/auth/hooks/useLogout.ts
import { useState } from "react";
import { useAuthStore } from "../state/authState";

export function useLogout() {
  const storeLogout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await storeLogout(); 
  };

  return { logout, isLoggingOut };
}