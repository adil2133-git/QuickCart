import { useNavigate } from "react-router-dom";
import type { UserRole } from "../features/auth/state/authState";

interface AccessDeniedProps {
  homePath: string;
  role: UserRole;
}

const ROLE_LABEL: Record<UserRole, string> = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  DRIVER: "driver",
  STORE: "store",
};

export default function AccessDenied({ homePath, role }: AccessDeniedProps) {
  const navigate = useNavigate();

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
            width: 56,
            height: 56,
            margin: "0 auto 24px",
            borderRadius: "50%",
            background: "#E8EFEC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="#145C43"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#16241D",
            margin: "0 0 8px",
          }}
        >
          You don't have access to this page
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#6E7C74",
            margin: "0 0 32px",
            lineHeight: 1.5,
          }}
        >
          This page is only available to {ROLE_LABEL[role] === "admin" ? "an" : "a"}{" "}
          {ROLE_LABEL[role]} account. You're signed in with a different role.
        </p>

        <button
          onClick={() => navigate(homePath, { replace: true })}
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
          Go to your dashboard
        </button>
      </div>
    </div>
  );
}