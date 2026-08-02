// src/features/auth/pages/deliveryPartnerRegistration.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { registerDriver } from "../../driver/driverAuthService";
import { getApiErrorMessage } from "../../../api/apiError";
import OtpVerificationModal from "../components/otpVerificationModal";
import PasswordStrengthBar from "../components/shared/passwordStrengthBar";
import { useInputFocusStyle } from "../hooks/useInputFocusStyle";
import { driverRegisterValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";

type VehicleType = "Bike" | "Scooter";

interface SectionHeaderProps {
  icon: React.ReactNode;
  label: string;
}

function SectionHeader({ icon, label }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: "#145C43" }}>{icon}</span>
      <span
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: "#145C43" }}
      >
        {label}
      </span>
    </div>
  );
}

interface UploadState {
  file: File | null;
  name: string | null;
  uploaded: boolean;
}

function DocumentCard({
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
  const { uploaded, name } = upload;
  return (
    <div
      onClick={() => ref.current?.click()}
      className="relative flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all"
      style={{
        borderStyle: uploaded ? "solid" : "dashed",
        borderColor: uploaded ? "#145C43" : "#DCE3DC",
        backgroundColor: uploaded ? "#E8EFEC" : "#F5F7F3",
      }}
    >
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
      />
      <div className="flex-shrink-0" style={{ color: uploaded ? "#145C43" : "#6E7C74" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold tracking-wide uppercase text-gray-800">
          {label}
        </p>
        <p
          className="text-xs mt-0.5 truncate"
          style={{
            color: uploaded ? "#145C43" : "#6E7C74",
            fontWeight: uploaded ? 600 : 400,
          }}
        >
          {uploaded ? `${name} uploaded` : sub}
        </p>
      </div>
      {uploaded && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="#145C43"
          stroke="none"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z" />
        </svg>
      )}
    </div>
  );
}

export default function DeliveryPartnerRegistration() {
  const navigate = useNavigate();

  const { handleFocus } = useInputFocusStyle("muted");
  const [drivingLicense, setDrivingLicense] = useState<UploadState>({ file: null, name: null, uploaded: false });
  const [vehicleRC, setVehicleRC] = useState<UploadState>({ file: null, name: null, uploaded: false });
  const [profilePhoto, setProfilePhoto] = useState<UploadState>({ file: null, name: null, uploaded: false });

  const [apiError, setApiError] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const inputClass =
    "w-full h-11 px-3 bg-white border outline-none text-sm text-gray-800 placeholder-gray-400 rounded-lg transition-all";
  const inputStyle = { borderColor: "#DCE3DC" };

  const formik = useFormik({
    initialValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      vehicleType: "Bike" as VehicleType,
      vehicleNumber: "",
      licenseNumber: "",
    },
    validationSchema: driverRegisterValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError("");

      if (!drivingLicense.file || !vehicleRC.file || !profilePhoto.file) {
        const docErr = "Driving License, Vehicle RC, and Profile Photo are all required.";
        setApiError(docErr);
        showErrorToast("Documents Missing", { subtitle: docErr });
        setSubmitting(false);
        return;
      }

      try {
        const lowerEmail = values.email.trim().toLowerCase();
        await registerDriver({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: lowerEmail,
          password: values.password,
          confirmPassword: values.confirmPassword,
          vehicleType: values.vehicleType,
          vehicleNumber: values.vehicleNumber.trim(),
          licenseNumber: values.licenseNumber.trim(),
          drivingLicense: drivingLicense.file,
          vehicleRC: vehicleRC.file,
          profilePhoto: profilePhoto.file,
        });

        setTargetEmail(lowerEmail);
        showSuccessToast("Verification OTP Sent", { subtitle: `Check your email: ${lowerEmail}` });
        setShowOtp(true);
      } catch (err: unknown) {
        const errMsg = getApiErrorMessage(err, "Registration failed. Please check your details.");
        setApiError(errMsg);
        showErrorToast("Registration Issue", { subtitle: errMsg });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-white">
      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col justify-between w-[320px] lg:w-[380px] h-full p-8 flex-shrink-0"
        style={{ backgroundColor: "#145C43" }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8FCDB0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <span className="font-bold text-white tracking-wide">QuickKart</span>
        </div>

        <div className="my-auto py-12">
          <span
            className="text-xs font-semibold tracking-widest uppercase block mb-2"
            style={{ color: "#8FCDB0" }}
          >
            Driver Network
          </span>
          <h1
            className="text-3xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Deliver freshness. Earn on your terms.
          </h1>
          <p className="text-xs leading-relaxed" style={{ color: "#C2E8D7" }}>
            Join thousands of neighborhood delivery partners with weekly payouts and per-order bonuses.
          </p>
        </div>

        <div className="space-y-6">
          <nav className="divide-y divide-white/10 border-t border-white/10">
            {[
              { label: "Flexible shifts", icon: <polyline points="20 6 9 17 4 12" />, bright: true },
              { label: "Transparent earnings", icon: <polyline points="20 6 9 17 4 12" />, bright: true },
              { label: "Fast delivery", icon: <polyline points="20 6 9 17 4 12" />, bright: false },
            ].map(({ label, icon, bright }, i) => (
              <div key={i} className="flex items-center gap-3 py-3" style={{ opacity: bright ? 1 : 0.7 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {icon}
                </svg>
                <span className="text-xs font-bold tracking-widest uppercase text-white">{label}</span>
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: "#8FCDB0" }}>© 2024 QuickKart</span>
          </div>
        </div>
      </aside>

      {/* ── Right panel ──────────────────────────────────────────────────── */}
      <section className="flex-1 h-full overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#DCE3DC #F5F7F3" }}>
        <div className="max-w-[480px] mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-6">
            <button type="button" onClick={() => navigate("/login")} className="hover:underline" style={{ color: "#145C43" }}>
              Login
            </button>
            <span className="text-gray-400">/</span>
            <button type="button" onClick={() => navigate("/create-account")} className="hover:underline" style={{ color: "#145C43" }}>
              Create Account
            </button>
            <span className="text-gray-400">/</span>
            <span className="font-bold" style={{ color: "#145C43" }}>Driver Registration</span>
          </nav>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Join as a Delivery Partner</h2>
            <p className="text-sm text-gray-500 mt-1">Fill in your details to start your journey with QuickKart.</p>
          </div>

          {/* Admin review notice */}
          <div className="flex items-start gap-3 p-4 mb-8 rounded" style={{ backgroundColor: "#F5F7F3", borderLeft: "3px solid #145C43" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#145C43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#6E7C74" }}>
              Your account will be reviewed by our admin team once submitted. We'll notify you via phone once your application is approved.
            </p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded bg-red-50 border border-red-200 text-sm text-red-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs leading-relaxed">{apiError}</p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-8" noValidate>
            {/* Section 1 — Personal Info */}
            <fieldset className="space-y-4">
              <SectionHeader label="Personal Info" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`${inputClass} ${formik.touched.name && formik.errors.name ? "border-red-400 focus:border-red-500" : ""}`}
                  style={inputStyle}
                  onFocus={handleFocus}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`${inputClass} ${formik.touched.email && formik.errors.email ? "border-red-400 focus:border-red-500" : ""}`}
                  style={inputStyle}
                  onFocus={handleFocus}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`${inputClass} ${formik.touched.phone && formik.errors.phone ? "border-red-400 focus:border-red-500" : ""}`}
                  style={inputStyle}
                  onFocus={handleFocus}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password (min. 8 characters)"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`${inputClass} ${formik.touched.password && formik.errors.password ? "border-red-400 focus:border-red-500" : ""}`}
                  style={inputStyle}
                  onFocus={handleFocus}
                />
                <PasswordStrengthBar password={formik.values.password} />
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`${inputClass} ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "border-red-400 focus:border-red-500" : ""}`}
                  style={inputStyle}
                  onFocus={handleFocus}
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.confirmPassword}</p>
                )}
              </div>
            </fieldset>

            {/* Section 2 — Vehicle & License */}
            <fieldset className="space-y-4">
              <SectionHeader label="Vehicle & License" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="12 8 8 12 12 16 12 8" /></svg>} />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehicle Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["Bike", "Scooter"] as VehicleType[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => formik.setFieldValue("vehicleType", v)}
                      className="py-2.5 px-3 border rounded-lg text-xs font-semibold transition-all"
                      style={{
                        borderColor: formik.values.vehicleType === v ? "#145C43" : "#DCE3DC",
                        backgroundColor: formik.values.vehicleType === v ? "#E8EFEC" : "#FAFAF8",
                        color: formik.values.vehicleType === v ? "#145C43" : "#4B5563",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehicle Registration Number</label>
                <input
                  id="vehicleNumber"
                  name="vehicleNumber"
                  type="text"
                  placeholder="e.g. KA 01 AB 1234"
                  value={formik.values.vehicleNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`${inputClass} ${formik.touched.vehicleNumber && formik.errors.vehicleNumber ? "border-red-400 focus:border-red-500" : ""}`}
                  style={inputStyle}
                  onFocus={handleFocus}
                />
                {formik.touched.vehicleNumber && formik.errors.vehicleNumber && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.vehicleNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Driving License Number</label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  placeholder="e.g. DL1420110012345"
                  value={formik.values.licenseNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`${inputClass} ${formik.touched.licenseNumber && formik.errors.licenseNumber ? "border-red-400 focus:border-red-500" : ""}`}
                  style={inputStyle}
                  onFocus={handleFocus}
                />
                {formik.touched.licenseNumber && formik.errors.licenseNumber && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.licenseNumber}</p>
                )}
              </div>
            </fieldset>

            {/* Section 3 — Documents Upload */}
            <fieldset className="space-y-4">
              <SectionHeader label="Documents Verification" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>} />

              <DocumentCard
                label="Driving License"
                sub="Front side of your physical DL"
                upload={drivingLicense}
                onUpload={(f) => setDrivingLicense({ file: f, name: f.name, uploaded: true })}
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 8h2m-2 4h2m-6 4h6" /></svg>}
              />

              <DocumentCard
                label="Vehicle RC"
                sub="Registration certificate of your vehicle"
                upload={vehicleRC}
                onUpload={(f) => setVehicleRC({ file: f, name: f.name, uploaded: true })}
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>}
              />

              <DocumentCard
                label="Profile Photo"
                sub="Clear headshot for customer verification"
                upload={profilePhoto}
                onUpload={(f) => setProfilePhoto({ file: f, name: f.name, uploaded: true })}
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>}
              />
            </fieldset>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3.5 rounded-lg font-bold text-sm text-white shadow-md transition-all cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: "#145C43" }}
            >
              {formik.isSubmitting ? "Submitting Application..." : "Submit Driver Application"}
            </button>
          </form>
        </div>
      </section>

      {showOtp && (
        <OtpVerificationModal
          email={targetEmail}
          onVerified={() => {
            setShowOtp(false);
            showSuccessToast("Application Submitted", { subtitle: "We will review your application soon." });
            navigate("/driver/pending");
          }}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  );
}