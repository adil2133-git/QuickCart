import { useNavigate } from "react-router-dom";
import { useAuthStore, type UserRole } from "../features/auth/state/authState";

const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: "/home",
  ADMIN: "/admin/dashboard",
  DRIVER: "/driver/dashboard",
  STORE: "/store/dashboard",
};

export default function NotFound() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const destination = isAuthenticated && user ? ROLE_HOME[user.role] ?? "/login" : "/login";
  const buttonLabel = isAuthenticated && user ? "Go to your dashboard" : "Go to login";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F7F8F5",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 440,
          textAlign: "center",
          background: "#FFFFFF",
          border: "1px solid #E3E7E1",
          borderRadius: 16,
          padding: "48px 40px",
          boxShadow: "0 4px 24px rgba(22, 36, 29, 0.06)",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#145C43",
            lineHeight: 1,
            marginBottom: 8,
            letterSpacing: "-2px",
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#16241D",
            margin: "0 0 8px",
          }}
        >
          This page doesn't exist
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#6E7C74",
            margin: "0 0 32px",
            lineHeight: 1.5,
          }}
        >
          Check the URL, or head back to somewhere that does.
        </p>

        <button
          onClick={() => navigate(destination, { replace: true })}
          style={{
            width: "100%",
            padding: "14px 0",
            background: "#145C43",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}