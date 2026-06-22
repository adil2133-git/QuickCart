// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore, type UserRole } from "../features/auth/state/authState";
import AccessDenied from "./accessDenied";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// Where the "Go to your dashboard" button sends each role
const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: "/home",
  ADMIN: "/admin/dashboard",
  DRIVER: "/driver/dashboard",
  STORE: "/store/dashboard",
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  // ── Not logged in at all ──────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // ── Logged in but wrong role ──────────────────────────────────────────────
  // Show a real page instead of silently redirecting — the user chooses
  // when to leave, and understands why they landed here.
  if (!allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role] ?? "/login";
    return <AccessDenied homePath={home} role={user.role} />;
  }

  // ── Authorised ────────────────────────────────────────────────────────────
  return <>{children}</>;
}