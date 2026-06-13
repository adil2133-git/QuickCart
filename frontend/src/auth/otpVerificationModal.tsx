import { useState, useRef, useEffect } from "react";

interface OtpVerificationModalProps {
  email: string;
  onClose: () => void;
  onVerified: () => void;
}

export default function OtpVerificationModal({ email, onClose, onVerified }: OtpVerificationModalProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [count, setCount] = useState(28);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setInterval(() => setCount((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [count]);

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value.length === 1 && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setTimeout(() => onVerified(), 800);
    }, 1200);
  };

  const handleResend = () => {
    setCount(28);
    setOtp(["", "", "", ""]);
    inputsRef.current[0]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A0E]/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center font-sans">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">Verify Your Email</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              We've sent a 4-digit code to{" "}
              <span className="text-gray-900 font-semibold">{email}</span>. Please enter it below to verify your account.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2 md:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={index === 0}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-14 h-14 text-center text-xl font-bold rounded-md outline-none border transition-all"
                  style={{ borderColor: "#D6C5B0", backgroundColor: "#FAFAF8" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#C9A97A";
                    e.target.style.boxShadow = "0 0 0 2px #C9A97A33";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#D6C5B0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className={`text-xs font-medium uppercase tracking-widest text-gray-400 transition-opacity ${count <= 0 ? "opacity-30" : ""}`}>
                {count > 0 ? (
                  <>
                    RESEND CODE IN <span className="tabular-nums" style={{ color: "#C9A97A" }}>{count}S</span>
                  </>
                ) : (
                  "YOU CAN RESEND NOW"
                )}
              </p>
              <button
                type="button"
                disabled={count > 0}
                onClick={handleResend}
                className={`text-xs font-semibold hover:underline transition-opacity ${count > 0 ? "opacity-50 cursor-not-allowed" : "opacity-100"}`}
                style={{ color: "#C9A97A" }}
              >
                RESEND NOW
              </button>
            </div>

            <button
              type="submit"
              disabled={verifying || verified || otp.some((d) => !d)}
              className={`w-full py-2.5 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 ${
                verified ? "bg-green-100 text-green-800" : "text-white"
              } ${verifying ? "opacity-80 pointer-events-none" : ""}`}
              style={!verified ? { backgroundColor: "#C9A97A" } : {}}
            >
              {verifying && (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {verified && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {verifying ? "" : verified ? "Verified" : "Verify & Proceed"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 opacity-60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-tight">Secure Encryption</span>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: "#FBF7F2", borderLeft: "3px solid #C9A97A" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your privacy is our priority. We only use this code for account verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}