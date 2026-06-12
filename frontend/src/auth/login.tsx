import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordModal from "./forgotPasswordModal";

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function QuickKartLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full font-sans">
      {/* Forgot Password modal rendered over the login page */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {/* Left Panel */}
      <div
        className="hidden md:flex flex-col justify-between w-[42%] min-h-screen px-8 py-8"
        style={{ backgroundColor: "#2C1A0E" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <span className="text-white font-semibold text-lg tracking-tight">QuickKart</span>
        </div>

        {/* Center Content */}
        <div className="flex flex-col gap-8 mt-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#C9A97A33" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>

          <div>
            <h1 className="text-white text-3xl font-bold leading-tight mb-3">
              Your neighbourhood<br />grocery, delivered fast.
            </h1>
            <p style={{ color: "#A08060" }} className="text-sm leading-relaxed">
              Connecting customers with nearby supermarkets<br />in real time.
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {[
              { icon: <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />, label: "Hyperlocal" },
              { icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" /></>, label: "Real-time product availability" },
              { icon: <polyline points="20 6 9 17 4 12" />, label: "Fast delivery" },
            ].map(({ icon, label }, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {icon}
                </svg>
                <span style={{ color: "#D4B896" }} className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8">
          <span style={{ color: "#6B4F35" }} className="text-xs">© 2024 QuickKart</span>
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B4F35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B4F35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.43.36a9 9 0 01-2.88 1.1A4.52 4.52 0 0016.11 0c-2.5 0-4.52 2-4.52 4.5 0 .35.04.7.11 1.03C7.69 5.37 4.07 3.58 1.64.9a4.5 4.5 0 00-.61 2.27c0 1.56.8 2.94 2 3.75A4.49 4.49 0 011 6.13v.06c0 2.19 1.56 4.01 3.63 4.42a4.52 4.52 0 01-2.04.08c.57 1.8 2.24 3.1 4.21 3.13A9.05 9.05 0 011 15.54a12.77 12.77 0 006.92 2.03c8.3 0 12.84-6.88 12.84-12.85 0-.2 0-.39-.01-.58A9.17 9.17 0 0023 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col justify-center items-center flex-1 bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-7">Login to your QuickKart account</p>

          {/* Phone or Email */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone or Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Enter your phone or email"
                className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-md outline-none text-gray-700 placeholder-gray-400"
                style={{ borderColor: "#D6C5B0", backgroundColor: "#FAFAF8" }}
                onFocus={(e) => { e.target.style.borderColor = "#C9A97A"; e.target.style.boxShadow = "0 0 0 2px #C9A97A33"; }}
                onBlur={(e) => { e.target.style.borderColor = "#D6C5B0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">Password</label>
              {/* Opens the modal inline */}
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs hover:underline"
                style={{ color: "#C9A97A" }}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2.5 text-sm border rounded-md outline-none text-gray-700 placeholder-gray-400"
                style={{ borderColor: "#D6C5B0", backgroundColor: "#FAFAF8" }}
                onFocus={(e) => { e.target.style.borderColor = "#C9A97A"; e.target.style.boxShadow = "0 0 0 2px #C9A97A33"; }}
                onBlur={(e) => { e.target.style.borderColor = "#D6C5B0"; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            className="w-full py-2.5 text-sm font-semibold rounded-md text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: "#C9A97A" }}
          >
            Login
          </button>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ backgroundColor: "#E8DDD0" }} />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#E8DDD0" }} />
          </div>

          {/* Create Account */}
          <p className="text-center text-sm text-gray-500 mb-3">Don't have an account?</p>
          <button
            onClick={() => navigate("/create-account")}
            className="w-full py-2.5 text-sm font-semibold rounded-md bg-white transition-colors hover:bg-amber-50"
            style={{ border: "1.5px solid #C9A97A", color: "#9A7A52" }}
          >
            Create an Account
          </button>

          {/* Admin Notice */}
          <p className="text-center text-xs text-gray-400 mt-8 leading-relaxed">
            Admin access is restricted to authorized personnel only.<br />Unauthorized attempts will be logged.
          </p>
        </div>
      </div>
    </div>
  );
}