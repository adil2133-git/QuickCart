// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore, type UserRole } from "../features/auth/state/authState";
import { useEffect, useRef } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// Where to redirect each role after a wrong-role attempt
const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: "/home",
  ADMIN: "/admin/dashboard",
  DRIVER: "/driver/dashboard",
  STORE: "/store/dashboard",
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();
  const toastShown = useRef(false); // prevent duplicate toasts on re-render

  const isWrongRole = isAuthenticated && !!user && !allowedRoles.includes(user.role);

  // ✅ useEffect is now called unconditionally on every render — hooks rule satisfied.
  // The conditional logic lives INSIDE the effect instead of around the hook call.
  useEffect(() => {
    if (isWrongRole && !toastShown.current) {
      toastShown.current = true;
      toast.error("You don't have access to this page.", {
        id: "wrong-role",
        duration: 3000,
      });
    }
  }, [isWrongRole]);

  // ── Not logged in at all ──────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // ── Logged in but wrong role ──────────────────────────────────────────────
  if (isWrongRole) {
    const home = ROLE_HOME[user.role] ?? "/login";
    return <Navigate to={home} replace />;
  }

  // ── Authorised ────────────────────────────────────────────────────────────
  return <>{children}</>;
}