import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registerDriver } from "../services/driverAuthService";
import OtpVerificationModal from "./otpVerificationModal"; // your existing OTP modal

type VehicleType = "Bike" | "Scooter";

interface UploadState {
  file: File | null;
  name: string | null;
  uploaded: boolean;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return { width: "0%", color: "transparent" };
    if (password.length <= 5) return { width: "33%", color: "#ba1a1a" };
    if (password.length <= 8) return { width: "66%", color: "#eeddc7" };
    if (/[0-9]/.test(password) && /[A-Z]/.test(password) && password.length > 8)
      return { width: "100%", color: "#4f6072" };
    return { width: "66%", color: "#eeddc7" };
  };
  const { width, color } = getStrength();
  return (
    <div className="w-full h-1 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: "#f4ece8" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width, backgroundColor: color }} />
    </div>
  );
}

function DocumentCard({
  icon, label, sub, upload, onUpload,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  upload: UploadState;
  onUpload: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const { uploaded, name } = upload;
  return (
    <div
      onClick={() => ref.current?.click()}
      className="relative flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all"
      style={{
        borderStyle: uploaded ? "solid" : "dashed",
        borderColor: uploaded ? "#4f6072" : "#d2c4b9",
        backgroundColor: uploaded ? "rgba(153,170,190,0.08)" : "#faf2ee",
      }}
    >
      <input ref={ref} type="file" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      <div className="w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ backgroundColor: uploaded ? "#99aabe" : "#e8e1dd" }}>
        <span style={{ color: uploaded ? "#2e3f4f" : "#735a3e" }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold tracking-wide uppercase text-gray-800">{label}</p>
        <p className="text-xs mt-0.5 truncate"
          style={{ color: uploaded ? "#4f6072" : "#80756b", fontWeight: uploaded ? 600 : 400 }}>
          {uploaded ? `${name} uploaded` : sub}
        </p>
      </div>
      {uploaded && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#4f6072" stroke="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z" />
        </svg>
      )}
    </div>
  );
}

export default function DeliveryPartnerRegistration() {
  const navigate = useNavigate();

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [vehicle, setVehicle]         = useState<VehicleType>("Bike");
  const [vehicleNumber, setVehicleNo] = useState("");
  const [licenseNumber, setLicenseNo] = useState("");

  const [drivingLicense, setDrivingLicense] = useState<UploadState>({ file: null, name: null, uploaded: false });
  const [vehicleRC, setVehicleRC]           = useState<UploadState>({ file: null, name: null, uploaded: false });
  const [profilePhoto, setProfilePhoto]     = useState<UploadState>({ file: null, name: null, uploaded: false });

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState("");
  const [showOtp, setShowOtp]       = useState(false);   // ← controls OTP modal

  // ── Input helpers ─────────────────────────────────────────────────────────────
  const inputClass =
    "w-full h-11 px-3 bg-white border outline-none text-sm text-gray-800 placeholder-gray-400 rounded-lg transition-all";
  const inputStyle = { borderColor: "#d2c4b9" };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#c2a383";
    e.target.style.boxShadow = "0 0 0 2px rgba(194,163,131,0.2)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#d2c4b9";
    e.target.style.boxShadow = "none";
  };

  const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: "#735a3e" }}>{icon}</span>
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#735a3e" }}>{label}</span>
    </div>
  );

  // ── Step 1 — submit form, open OTP modal on success ───────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (password !== confirmPassword) {
      setApiError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await registerDriver({
        name, phone, email, password, confirmPassword,
        vehicleType: vehicle, vehicleNumber, licenseNumber,
        drivingLicense: drivingLicense.file,
        vehicleRC: vehicleRC.file,
        profilePhoto: profilePhoto.file,
      });

      // Backend sent OTP → show the modal
      setShowOtp(true);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2 — OTP verified → go to pending-approval page ──────────────────────
  const handleDriverVerified = () => {
    setShowOtp(false);
    navigate("/driver/pending");
  };

  const vehicles: VehicleType[] = ["Bike", "Scooter"];

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ backgroundColor: "#fff8f4" }}>

      {/* OTP modal — rendered on top when showOtp is true */}
      {showOtp && (
        <OtpVerificationModal
          email={email}
          onClose={() => setShowOtp(false)}
          onVerified={handleDriverVerified}
        />
      )}

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex relative w-[40%] h-full overflow-hidden flex-shrink-0"
        style={{ backgroundColor: "#291803" }}>
        <div className="absolute inset-0 z-0"
          style={{ background: "linear-gradient(rgba(41,24,3,0.4), rgba(41,24,3,0.85))" }} />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full text-white">
          <div>
            <span className="text-2xl font-bold tracking-tight">QuickKart</span>
            <h1 className="text-3xl font-bold leading-tight mt-10 mb-3">
              Empowering local delivery partners.
            </h1>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: "#e0d9d4" }}>
              Join our network and help us bring fresh groceries to every doorstep in your neighborhood.
            </p>
          </div>
          <nav className="space-y-1">
            {[
              { label: "Hyperlocal",             icon: <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />,              bright: true  },
              { label: "Real-time availability", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" /></>, bright: false },
              { label: "Fast delivery",          icon: <polyline points="20 6 9 17 4 12" />,                                       bright: false },
            ].map(({ label, icon, bright }, i) => (
              <div key={i} className="flex items-center gap-3 py-3" style={{ opacity: bright ? 1 : 0.7 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                <span className="text-xs font-bold tracking-widest uppercase text-white">{label}</span>
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B4F35" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" />
            </svg>
            <span className="text-xs" style={{ color: "#6B4F35" }}>© 2024 QuickKart</span>
          </div>
        </div>
      </aside>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <section className="flex-1 h-full overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#d2c4b9 #f4ece8" }}>
        <div className="max-w-[480px] mx-auto px-6 py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-6">
            <button onClick={() => navigate("/login")} className="hover:underline" style={{ color: "#735a3e" }}>Login</button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <button onClick={() => navigate("/create-account")} className="hover:underline" style={{ color: "#735a3e" }}>Create Account</button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="font-bold" style={{ color: "#735a3e" }}>Registration</span>
          </nav>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Join as a Delivery Partner</h2>
            <p className="text-sm text-gray-500 mt-1">Fill in your details to start your journey with QuickKart.</p>
          </div>

          {/* Admin review notice */}
          <div className="flex items-start gap-3 p-4 mb-8 rounded"
            style={{ backgroundColor: "#f4ece8", borderLeft: "3px solid #eeddc7" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6d614f" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#6d614f" }}>
              Your account will be reviewed by our admin team once submitted. We'll notify you via phone once your application is approved.
            </p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded"
              style={{ backgroundColor: "#ffdad6", borderLeft: "3px solid #ba1a1a" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: "#93000a" }}>{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1 — Personal Info */}
            <fieldset className="space-y-4">
              <SectionHeader label="Personal Info"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input type="text" placeholder="John Doe" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input type="email" placeholder="john@example.com" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} pl-9`} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 5.18 2 2 0 015.09 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 17.92z" />
                    </svg>
                  </span>
                  <input type="tel" placeholder="+91 98765 43210" required value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${inputClass} pl-9`} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                  <input type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  <PasswordStrengthBar password={password} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                  <input type="password" required value={confirmPassword}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                    style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? "#ba1a1a" : "#d2c4b9" }}
                    onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>
            </fieldset>

            {/* Section 2 — Vehicle Info */}
            <fieldset className="space-y-4">
              <SectionHeader label="Vehicle Info"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M15 6H3v11.5" /><path d="M3 9h10l2 5h3l1-5" /></svg>} />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Vehicle Type</label>
                <div className="flex gap-2">
                  {vehicles.map((v) => (
                    <button key={v} type="button" onClick={() => setVehicle(v)}
                      className="flex-1 py-2 text-xs font-bold tracking-wide rounded-lg border transition-all"
                      style={{ backgroundColor: vehicle === v ? "#735a3e" : "white", color: vehicle === v ? "white" : "#1e1b19", borderColor: vehicle === v ? "#735a3e" : "#d2c4b9" }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehicle Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </span>
                  <input type="text" placeholder="ABC-1234" required value={vehicleNumber}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className={`${inputClass} pl-9`} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">License Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15s0-4 5-4 5 4 5 4" /><circle cx="12" cy="9" r="2" />
                    </svg>
                  </span>
                  <input type="text" placeholder="LIC-556677" required value={licenseNumber}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    className={`${inputClass} pl-9`} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>
            </fieldset>

            {/* Section 3 — Documents */}
            <fieldset className="space-y-4">
              <SectionHeader label="Documents"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>} />
              <div className="space-y-3">
                <DocumentCard
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15s0-4 5-4 5 4 5 4" /><circle cx="12" cy="9" r="2" /></svg>}
                  label="Driving License" sub="PDF, JPG or PNG (Max 5MB)"
                  upload={drivingLicense}
                  onUpload={(f) => setDrivingLicense({ file: f, name: f.name, uploaded: true })} />
                <DocumentCard
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
                  label="Vehicle RC" sub="PDF, JPG or PNG (Max 5MB)"
                  upload={vehicleRC}
                  onUpload={(f) => setVehicleRC({ file: f, name: f.name, uploaded: true })} />
                <DocumentCard
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>}
                  label="Profile Photo" sub="Clear recent photograph"
                  upload={profilePhoto}
                  onUpload={(f) => setProfilePhoto({ file: f, name: f.name, uploaded: true })} />
              </div>
            </fieldset>

            {/* Submit */}
            <div className="pt-2 pb-8">
              <button type="submit" disabled={submitting}
                className="w-full h-12 text-xs font-bold tracking-widest uppercase rounded-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#c2a383", color: "#291803", boxShadow: "0 8px 24px rgba(115,90,62,0.15)" }}>
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
              <p className="text-center mt-3 text-xs text-gray-500">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/login")}
                  className="font-bold hover:underline" style={{ color: "#735a3e" }}>
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}