import { useState } from "react";
import api from "../../../api/axios";
import OtpVerificationModal from "./otpVerificationModal";
import ResetPasswordModal from "./resetPasswordModal";

type FPStep = "email" | "otp" | "reset" | "done";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<FPStep>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password/send-otp", { email: trimmed });
      // Always move to OTP step — backend doesn't reveal if email exists
      setEmail(trimmed);
      setStep("otp");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = axiosError.response?.data?.message;
      if (axiosError.response?.status === 429) {
        setError("OTP already sent. Please wait before requesting again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Called by OtpVerificationModal when OTP is accepted.
   * In fp mode the modal calls this with { resetToken, email } instead of
   * navigating — we intercept that via the onVerified prop.
   */
  const handleOtpVerified = (token: string) => {
    setResetToken(token);
    setStep("reset");
  };

  const handleResetDone = () => {
    setStep("done");
  };

  // ── Done state ──────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(42,26,10,0.50)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="relative w-full max-w-md rounded-xl shadow-2xl px-10 py-10 flex flex-col items-center text-center"
          style={{ backgroundColor: "#fff8f4" }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: "#dcf5e7" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password reset!</h2>
          <p className="text-sm mb-8" style={{ color: "#4e453d" }}>
            Your password has been updated successfully. You can now log in with your new password.
          </p>
          <button
            onClick={onClose}
            className="w-full h-12 font-bold text-sm rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#c2a383", color: "#2a1a0a" }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── OTP step — delegate entirely to existing OtpVerificationModal ───────
  if (step === "otp") {
    return (
      <OtpVerificationModal
        email={email}
        mode="forgotPassword"
        onClose={onClose}
        onVerified={() => {}}          // unused in fp mode
        onFpVerified={handleOtpVerified}
      />
    );
  }

  // ── Reset password step ─────────────────────────────────────────────────
  if (step === "reset") {
    return (
      <ResetPasswordModal
        email={email}
        resetToken={resetToken}
        onClose={onClose}
        onDone={handleResetDone}
      />
    );
  }

  // ── Email entry (default) ───────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(42,26,10,0.50)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
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

        {/* Icon */}
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
            Enter your registered email and we'll send a 4-digit verification code to reset your password.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-md px-4 py-3 mb-4 bg-red-50 border border-red-200">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-500 mb-1.5 ml-0.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#80756b" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full h-11 pl-10 pr-4 text-sm border rounded-lg outline-none text-gray-800 placeholder-gray-400 transition-all"
                style={{ borderColor: "#d2c4b9", backgroundColor: "white" }}
                onFocus={(e) => { e.target.style.borderColor = "#c2a383"; e.target.style.boxShadow = "0 0 0 2px rgba(194,163,131,0.2)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#d2c4b9"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
            style={{ backgroundColor: "#c2a383", color: "#2a1a0a" }}
          >
            {loading ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send Verification Code
              </>
            )}
          </button>
        </form>

        {/* Back to login */}
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
    </div>
  );
}