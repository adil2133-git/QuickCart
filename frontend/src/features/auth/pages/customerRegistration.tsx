// src/features/auth/pages/customerRegistration.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import OtpVerificationModal from "../components/otpVerificationModal";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";
import { useAuthStore } from "../state/authState";
import EyeIcon from "../components/shared/eyeIcon";
import { useInputFocusStyle } from "../hooks/useInputFocusStyle";
import { customerRegisterValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";

export default function CustomerRegistration() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();
  const hydrate = useAuthStore((state) => state.hydrate);
  const { handleFocus } = useInputFocusStyle();

  const inputClass =
    "w-full pl-9 pr-4 py-2.5 text-sm border rounded-md outline-none text-gray-700 placeholder-gray-400 transition-all";
  const inputStyle = { borderColor: "#D6C5B0", backgroundColor: "#FAFAF8" };

  const formik = useFormik({
    initialValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: customerRegisterValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError("");
      try {
        const lowerEmail = values.email.trim().toLowerCase();
        await api.post("/auth/register/customer", {
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: lowerEmail,
          password: values.password,
        });

        setTargetEmail(lowerEmail);
        showSuccessToast("Verification OTP Sent", { subtitle: `Check your email: ${lowerEmail}` });
        setShowOtp(true);
      } catch (err: unknown) {
        const errMsg = getApiErrorMessage(err, "Registration failed. Please check your details.");
        setServerError(errMsg);
        showErrorToast("Registration Issue", { subtitle: errMsg });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleVerified = async () => {
    setShowOtp(false);
    await hydrate();
    showSuccessToast("Account Created", { subtitle: "Welcome to QuickKart!" });
    navigate("/customer/home");
  };

  return (
    <div className="flex min-h-screen w-full font-sans">
      {/* ── Left Panel ─────────────────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col justify-between w-[42%] min-h-screen px-8 py-8"
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
            className="text-xs font-semibold uppercase tracking-widest block mb-3"
            style={{ color: "#8FCDB0" }}
          >
            Join as Customer
          </span>

          <h1
            className="text-3xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Fresh groceries from local stores, delivered in minutes.
          </h1>

          <p className="text-sm leading-relaxed mb-8" style={{ color: "#C2E8D7" }}>
            Real-time store inventory, transparent prices, and zero missing items.
            Enjoy instant delivery from your community supermarkets.
          </p>

          <div className="space-y-3">
            {[
              {
                label: "Live store inventory tracking",
                icon: <polyline points="20 6 9 17 4 12" />,
              },
              {
                label: "Store-direct shelf prices",
                icon: <polyline points="20 6 9 17 4 12" />,
              },
              {
                label: "Express 15-minute delivery",
                icon: <polyline points="20 6 9 17 4 12" />,
              },
            ].map(({ label, icon }, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8FCDB0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icon}
                </svg>
                <span style={{ color: "#8FCDB0" }} className="text-sm">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <span style={{ color: "#8FCDB0" }} className="text-xs">
          © 2024 QuickKart
        </span>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 bg-white px-10 py-8 overflow-y-auto">
        <div className="flex items-center gap-1.5 text-xs mb-6">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="hover:underline"
            style={{ color: "#145C43" }}
          >
            Login
          </button>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <button
            type="button"
            onClick={() => navigate("/create-account")}
            className="hover:underline"
            style={{ color: "#145C43" }}
          >
            Create Account
          </button>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-gray-500">Customer Registration</span>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create your Customer account
          </h2>

          <div className="flex items-center gap-1.5 mb-6">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <span
              className="text-sm font-medium"
              style={{ color: "#16a34a" }}
            >
              Immediate access — no approval needed
            </span>
          </div>

          {/* In-Card Error Alert Banner */}
          {serverError && (
            <div className="flex items-center gap-2 rounded-md px-4 py-3 mb-4 bg-red-50 border border-red-200 text-sm text-red-600">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{serverError}</p>
            </div>
          )}

          {/* Formik Customer Registration Form */}
          <form onSubmit={formik.handleSubmit} noValidate>
            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter your full name"
                  className={`${inputClass} ${
                    formik.touched.name && formik.errors.name ? "border-red-400 focus:border-red-500" : ""
                  }`}
                  style={{ ...inputStyle }}
                  onFocus={handleFocus}
                />
              </div>
              {formik.touched.name && formik.errors.name && (
                <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 5.18 2 2 0 015.09 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 17.92z" />
                  </svg>
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="10-digit mobile number"
                  className={`${inputClass} ${
                    formik.touched.phone && formik.errors.phone ? "border-red-400 focus:border-red-500" : ""
                  }`}
                  style={{ ...inputStyle }}
                  onFocus={handleFocus}
                />
              </div>
              {formik.touched.phone && formik.errors.phone ? (
                <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.phone}</p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1">Used for delivery updates and driver communication.</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="name@example.com"
                  className={`${inputClass} ${
                    formik.touched.email && formik.errors.email ? "border-red-400 focus:border-red-500" : ""
                  }`}
                  style={{ ...inputStyle }}
                  onFocus={handleFocus}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter password (min. 8 characters)"
                  className={`${inputClass} pr-10 ${
                    formik.touched.password && formik.errors.password ? "border-red-400 focus:border-red-500" : ""
                  }`}
                  style={{ ...inputStyle }}
                  onFocus={handleFocus}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Re-enter your password"
                  className={`${inputClass} pr-10 ${
                    formik.touched.confirmPassword && formik.errors.confirmPassword
                      ? "border-red-400 focus:border-red-500"
                      : ""
                  }`}
                  style={{ ...inputStyle }}
                  onFocus={handleFocus}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="mt-1 text-[11px] font-medium text-red-600 pl-1">{formik.errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3 rounded-md font-medium text-sm text-white shadow-sm transition-colors cursor-pointer"
              style={{ backgroundColor: "#145C43" }}
            >
              {formik.isSubmitting ? "Sending OTP..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>

      {showOtp && (
        <OtpVerificationModal
          email={targetEmail}
          onVerified={handleVerified}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  );
}