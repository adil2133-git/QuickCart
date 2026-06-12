import { useState } from "react";

type FPStatus = "idle" | "loading" | "sent";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [status, setStatus] = useState<FPStatus>("idle");
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      setStatus("sent");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(42,26,10,0.50)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-xl shadow-2xl px-10 py-10 flex flex-col"
        style={{ backgroundColor: "#fff8f4" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 transition-colors hover:text-amber-700"
          style={{ color: "#80756b" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Icon badge */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "#f1e0ca" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#735a3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">Forgot Password?</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#4e453d" }}>
            Enter your registered email address or phone number and we'll send a 4-digit verification code to your email or phone.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-500 mb-1.5 ml-0.5">
              Email or Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#80756b" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="name@example.com or +1..."
                disabled={status === "sent"}
                className="w-full h-11 pl-10 pr-4 text-sm border rounded-lg outline-none text-gray-800 placeholder-gray-400 transition-all"
                style={{ borderColor: "#d2c4b9", backgroundColor: "white" }}
                onFocus={(e) => { e.target.style.borderColor = "#c2a383"; e.target.style.boxShadow = "0 0 0 2px rgba(194,163,131,0.2)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#d2c4b9"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status !== "idle"}
            className="w-full h-12 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: status === "sent" ? "#99aabe" : "#c2a383",
              color: "#2a1a0a",
            }}
          >
            {status === "idle" && (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send Verification Code
              </>
            )}
            {status === "loading" && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            )}
            {status === "sent" && (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Code Sent
              </>
            )}
          </button>
        </form>

        {/* Divider + Back */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="w-full h-px" style={{ backgroundColor: "#d2c4b9" }} />
          <div className="flex items-center gap-1.5 text-sm">
            <span style={{ color: "#4e453d" }}>Remembered your password?</span>
            <button
              onClick={onClose}
              className="font-bold hover:underline underline-offset-4 decoration-2"
              style={{ color: "#735a3e" }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        className="fixed bottom-8 left-4 right-4 max-w-md mx-auto flex items-center gap-3 px-4 py-4 rounded-xl border shadow-lg transition-all duration-300"
        style={{
          backgroundColor: "#eeddc7",
          borderColor: "#d2c4b9",
          color: "#6d614f",
          opacity: showToast ? 1 : 0,
          transform: showToast ? "translateY(0)" : "translateY(32px)",
          pointerEvents: "none",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#6d614f" stroke="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z" />
        </svg>
        <p className="text-sm font-medium">Reset instructions sent successfully.</p>
      </div>
    </div>
  );
}