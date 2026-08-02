import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../state/authState";

export function useLogout() {
  const storeLogout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await storeLogout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}