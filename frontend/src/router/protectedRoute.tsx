import { Navigate } from "react-router-dom";
import { useAuthStore, type UserRole } from "../features/auth/state/authState";
import AccessDenied from "./accessDenied";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// where the "Go to your dashboard" button sends each role
const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: "/home",
  ADMIN: "/admin/dashboard",
  DRIVER: "/driver/dashboard",
  STORE: "/store/dashboard",
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If a driver or store account is not active (PENDING_APPROVAL, REJECTED, or SUSPENDED),
  // block access to the dashboard and redirect directly to their pending status screen
  if ((user.role === "DRIVER" || user.role === "STORE") && user.status && user.status !== "ACTIVE") {
    const pendingPath = user.role === "DRIVER" ? "/driver/pending" : "/store/pending";
    return <Navigate to={pendingPath} replace />;
  }

  // logged in but wrong role — show a real page instead of silently
  // redirecting, so the user understands why they landed here
  if (!allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role] ?? "/login";
    return <AccessDenied homePath={home} role={user.role} />;
  }

  return <>{children}</>;
}