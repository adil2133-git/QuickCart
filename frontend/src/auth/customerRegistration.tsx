import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerRegistration() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const inputClass = "w-full pl-9 pr-4 py-2.5 text-sm border rounded-md outline-none text-gray-700 placeholder-gray-400";
  const inputStyle = { borderColor: "#D6C5B0", backgroundColor: "#FAFAF8" };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#C9A97A";
    e.target.style.boxShadow = "0 0 0 2px #C9A97A33";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#D6C5B0";
    e.target.style.boxShadow = "none";
  };

  const EyeIcon = ({ open }: { open: boolean }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open
        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
    </svg>
  );

  return (
    <div className="flex min-h-screen w-full font-sans">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-between w-[42%] min-h-screen px-8 py-8" style={{ backgroundColor: "#2C1A0E" }}>
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <span className="text-white font-semibold text-lg tracking-tight">QuickKart</span>
        </div>

        <div className="flex flex-col gap-8">
          <h1 className="text-white text-3xl font-bold leading-tight">
            Your neighbourhood<br />grocery, delivered fast.
          </h1>
          <div className="flex flex-col gap-4">
            {[
              { label: "Hyperlocal", icon: <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /> },
              { label: "Real-time availability", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" /></> },
              { label: "Fast delivery", icon: <polyline points="20 6 9 17 4 12" /> },
            ].map(({ label, icon }, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                <span style={{ color: "#D4B896" }} className="text-sm">{label}</span>
              </div>
            ))}
          </div>
          <div className="w-full rounded-xl overflow-hidden" style={{ height: 180, background: "linear-gradient(135deg,#3a2010 0%,#1a0e06 100%)", border: "1px solid #4a3020" }}>
            <div className="w-full h-full flex items-center justify-center opacity-40">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l1-5h16l1 5" /><path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" /><path d="M9 9v12M15 9v12M3 14h18" />
              </svg>
            </div>
          </div>
        </div>

        <span style={{ color: "#6B4F35" }} className="text-xs">© 2024 QuickKart</span>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col flex-1 bg-white px-10 py-8 overflow-y-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-6">
          <button onClick={() => navigate("/login")} className="hover:underline" style={{ color: "#C9A97A" }}>Login</button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <button onClick={() => navigate("/create-account")} className="hover:underline" style={{ color: "#C9A97A" }}>Create Account</button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="text-gray-500">Customer Registration</span>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your Customer account</h2>

          {/* Badge */}
          <div className="flex items-center gap-1.5 mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
            </svg>
            <span className="text-sm font-medium" style={{ color: "#16a34a" }}>Immediate access — no approval needed</span>
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input type="text" placeholder="Enter your full name" className={inputClass} style={{ ...inputStyle }} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* Phone */}
          <div className="mb-1.5">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 5.18 2 2 0 015.09 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 17.92z" />
                </svg>
              </span>
              <input type="tel" placeholder="+1 (555) 000-0000" className={inputClass} style={{ ...inputStyle }} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">Used for delivery updates and driver communication.</p>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input type="email" placeholder="name@example.com" className={inputClass} style={{ ...inputStyle }} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>
              <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className={`${inputClass} pr-10`} style={{ ...inputStyle }} onFocus={handleFocus} onBlur={handleBlur} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>
              <input type={showConfirm ? "text" : "password"} placeholder="Repeat your password" className={`${inputClass} pr-10`} style={{ ...inputStyle }} onFocus={handleFocus} onBlur={handleBlur} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-lg px-4 py-3 mb-5" style={{ backgroundColor: "#FBF7F2", borderLeft: "3px solid #C9A97A" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <p className="text-xs text-gray-600 leading-relaxed">Your account will be activated immediately upon clicking create account.</p>
          </div>

          {/* Submit */}
          <button className="w-full py-2.5 text-sm font-semibold rounded-md text-white transition-opacity hover:opacity-90 active:opacity-80 mb-4" style={{ backgroundColor: "#C9A97A" }}>
            Create Account
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="font-semibold hover:underline" style={{ color: "#2C1A0E" }}>
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
