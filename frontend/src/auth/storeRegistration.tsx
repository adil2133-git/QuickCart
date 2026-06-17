import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import OtpVerificationModal from "./OtpVerificationModal"; // adjust path as needed

type UploadState = { file: File | null };

function PasswordStrengthBar({ password }: { password: string }) {
  const len = password.length;
  const getColor = (index: number) => {
    if (len === 0) return "#e8e1dd";
    if (len <= 4) return index < 1 ? "#ba1a1a" : "#e8e1dd";
    if (len <= 8) return index < 2 ? "#f1e0ca" : "#e8e1dd";
    if (len <= 12) return index < 3 ? "#735a3e" : "#e8e1dd";
    return "#4f6072";
  };
  return (
    <div className="flex gap-1 mt-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex-1 h-1 rounded-sm transition-all duration-300" style={{ backgroundColor: getColor(i) }} />
      ))}
    </div>
  );
}

function UploadCard({
  icon,
  label,
  sub,
  upload,
  onUpload,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  upload: UploadState;
  onUpload: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const uploaded = !!upload.file;
  return (
    <div
      onClick={() => ref.current?.click()}
      className="relative group p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
      style={{
        borderColor: uploaded ? "#735a3e" : "#d2c4b9",
        backgroundColor: uploaded ? "#f9f4ee" : "#faf2ee",
      }}
    >
      <input
        ref={ref}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }}
      />
      <div style={{ color: uploaded ? "#735a3e" : "#80756b" }}>{icon}</div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs mt-0.5" style={{ color: uploaded ? "#735a3e" : "#80756b", fontWeight: uploaded ? 600 : 400 }}>
          {uploaded ? `Uploaded: ${upload.file?.name}` : sub}
        </p>
      </div>
    </div>
  );
}

export default function StoreRegistration() {
  const navigate = useNavigate();

  // Text fields
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // File uploads
  const [tradeLicense, setTradeLicense] = useState<UploadState>({ file: null });
  const [ownerID, setOwnerID] = useState<UploadState>({ file: null });
  const [storeFront, setStoreFront] = useState<UploadState>({ file: null });

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const inputClass =
    "w-full h-11 px-3 bg-white border rounded-lg outline-none text-sm text-gray-800 placeholder-gray-400 transition-all";
  const inputStyle = { borderColor: "#d2c4b9" };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#c2a383";
    e.target.style.boxShadow = "0 0 0 2px rgba(194,163,131,0.2)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#d2c4b9";
    e.target.style.boxShadow = "none";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!storeName.trim() || !ownerName.trim() || !address.trim() || !pincode.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!tradeLicense.file || !ownerID.file || !storeFront.file) {
      setError("Trade license, owner ID, and store front photo are all required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("storeName", storeName.trim());
      formData.append("ownerName", ownerName.trim());
      formData.append("address", address.trim());
      formData.append("pincode", pincode.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);
      formData.append("tradeLicense", tradeLicense.file);
      formData.append("ownerId", ownerID.file);
      formData.append("storeFront", storeFront.file);

      await api.post("/auth/register/store", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowOtpModal(true);

    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans" style={{ backgroundColor: "#fff8f4" }}>
      {showOtpModal && (
        <OtpVerificationModal
          email={email.trim().toLowerCase()}
          onClose={() => setShowOtpModal(false)}
          onVerified={() => navigate("/store/pending")}
        />
      )}

      {/* Left Panel */}
      <aside
        className="hidden md:flex flex-col justify-between w-[40%] min-h-screen px-10 py-10 relative overflow-hidden flex-shrink-0"
        style={{ backgroundColor: "#291803" }}
      >
        {/* BG texture overlay */}
        <div className="absolute inset-0 opacity-20 grayscale pointer-events-none">
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#3a2010 0%,#1a0e06 100%)" }} />
        </div>

        <div className="relative z-10">
          <span className="text-white font-bold text-2xl tracking-tight">QuickKart</span>

          <div className="mt-10 space-y-4">
            <h1 className="text-white text-3xl font-bold leading-tight">
              Grow your business with hyperlocal delivery.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#a08060" }}>
              Your neighbourhood grocery, delivered fast. Join our network of premium local stores.
            </p>
          </div>

          <nav className="mt-10 space-y-1">
            {[
              { label: "Hyperlocal", icon: <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /> },
              { label: "Real-time availability", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" /></> },
              { label: "Fast delivery", icon: <><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" /><rect x="9" y="11" width="14" height="10" rx="2" /><circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" /></> },
            ].map(({ label, icon }, i) => (
              <div key={i} className="flex items-center gap-3 py-3 cursor-pointer group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A97A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#a08060" }}>{label}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="relative z-10 flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B4F35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" />
          </svg>
          <span className="text-xs" style={{ color: "#6B4F35" }}>© 2024 QuickKart</span>
        </div>
      </aside>

      {/* Right Panel */}
      <main className="flex-1 h-screen overflow-y-auto px-6 md:px-0 py-10">
        <div className="max-w-[480px] mx-auto space-y-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs">
            <button onClick={() => navigate("/login")} className="hover:underline" style={{ color: "#735a3e" }}>Login</button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <button onClick={() => navigate("/create-account")} className="hover:underline" style={{ color: "#735a3e" }}>Create Account</button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="font-bold" style={{ color: "#735a3e" }}>Store Registration</span>
          </nav>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Register your Store</h2>
            <p className="text-sm text-gray-500 mt-1">Partner with us to reach thousands of customers in your locality.</p>
          </div>

          {/* Admin Review Notice */}
          <div
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{ backgroundColor: "rgba(238,221,199,0.25)", borderLeft: "4px solid #c2a383" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#735a3e" stroke="none" className="mt-0.5 flex-shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#6d614f" }}>
              Your store will be reviewed and approved by our admin team within 24–48 hours after submission. Ensure all documents are clear and valid.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-md px-4 py-3 bg-red-50 border border-red-200">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1: Store Info */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "#e8e1dd" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#735a3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l1-5h16l1 5" /><path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" /><path d="M9 9v12M15 9v12" />
                </svg>
                <h3 className="text-base font-semibold text-gray-900">Store Info</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Store Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l1-5h16l1 5" /><path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Green Valley Organics"
                      className={`${inputClass} pl-9`}
                      style={inputStyle}
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Owner Name</label>
                  <input
                    type="text"
                    placeholder="Legal full name"
                    className={inputClass}
                    style={inputStyle}
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Address</label>
                  <textarea
                    placeholder="Full street address, building number, landmark"
                    rows={3}
                    className="w-full p-3 bg-white border rounded-lg outline-none text-sm text-gray-800 placeholder-gray-400 resize-none transition-all"
                    style={inputStyle}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Pincode</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="6-digit postal code"
                      className={`${inputClass} pl-9`}
                      style={inputStyle}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Credentials */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "#e8e1dd" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#735a3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <h3 className="text-base font-semibold text-gray-900">Credentials</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="name@store.com"
                    className={inputClass}
                    style={inputStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    className={inputClass}
                    style={inputStyle}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    className={inputClass}
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <PasswordStrengthBar password={password} />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    className={inputClass}
                    style={inputStyle}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Documents */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "#e8e1dd" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#735a3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <h3 className="text-base font-semibold text-gray-900">Documents</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <UploadCard
                  icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>}
                  label="Trade License"
                  sub="PDF, JPG or PNG (Max 5MB)"
                  upload={tradeLicense}
                  onUpload={(f) => setTradeLicense({ file: f })}
                />
                <UploadCard
                  icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15s0-4 5-4 5 4 5 4" /><circle cx="12" cy="9" r="2" /></svg>}
                  label="Owner ID Proof"
                  sub="Government Issued ID"
                  upload={ownerID}
                  onUpload={(f) => setOwnerID({ file: f })}
                />
                <UploadCard
                  icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>}
                  label="Store Front Photo"
                  sub="Clear photo of the shop entrance"
                  upload={storeFront}
                  onUpload={(f) => setStoreFront({ file: f })}
                />
              </div>
            </section>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-70"
                style={{ backgroundColor: "#c2a383", color: "#291803", boxShadow: "0 8px 24px rgba(42,26,10,0.08)" }}
              >
                {loading ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l1-5h16l1 5" /><path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                  </svg>
                )}
                {loading ? "Submitting..." : "Submit Store Application"}
              </button>
              <p className="mt-3 text-xs text-center text-gray-500">
                By clicking submit, you agree to QuickKart's{" "}
                <a href="#" className="font-semibold underline" style={{ color: "#735a3e" }}>Merchant Terms &amp; Conditions</a>.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}