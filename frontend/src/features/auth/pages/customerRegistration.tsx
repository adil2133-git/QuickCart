import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { User, Mail, Phone, Lock, KeyRound, ArrowRight } from "lucide-react";
import OtpVerificationModal from "../components/otpVerificationModal";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";
import { useAuthStore } from "../state/authState";
import { customerRegisterValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";
import customerRegBg from "../../../assets/customer_reg_bg.webp";

export default function CustomerRegistration() {
  const [showOtp, setShowOtp] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(true);

  const navigate = useNavigate();
  const hydrate = useAuthStore((state) => state.hydrate);

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
      if (!agreedTerms) {
        setServerError("You must agree to the Terms of Service and Privacy Policy.");
        return;
      }
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
    <div 
      className="relative flex min-h-screen w-full items-center justify-center p-4 sm:p-6 font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${customerRegBg})` }}
    >
      {/* Soft overlay to guarantee perfect text contrast */}
      <div className="absolute inset-0 bg-black/10 backdrop-brightness-[0.97]" />

      {/* Centered Glassmorphic Registration Card */}
      <div className="relative z-10 w-full max-w-[450px] rounded-[36px] border border-white/80 bg-white/75 p-7 sm:p-9 shadow-2xl shadow-black/15 backdrop-blur-2xl transition-all">
        
        {/* Top Branding Header */}
        <div className="text-center mb-6">
          <h1 
            className="text-3xl font-bold text-[#063826] tracking-tight mb-1" 
            style={{ fontFamily: "Fraunces, serif" }}
          >
            QuickKart
          </h1>
          <p className="text-[10px] font-bold tracking-[0.22em] text-[#4A5D54] uppercase mb-5">
            JOIN THE FRESHNESS REVOLUTION
          </p>
          <h2 
            className="text-2xl font-semibold text-[#0F1E17]" 
            style={{ fontFamily: "Fraunces, serif" }}
          >
            Create Your Account
          </h2>
        </div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-5 bg-red-50/90 border border-red-200 text-xs font-medium text-red-600 text-left">
            <p>{serverError}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-left text-xs font-semibold text-[#33463D] mb-1.5 pl-1">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8B83]">
                <User size={16} />
              </span>
              <input
                id="name"
                name="name"
                type="text"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="John Doe"
                className={`w-full pl-11 pr-4 py-3 text-sm rounded-full bg-[#EFECE6]/75 border ${
                  formik.touched.name && formik.errors.name 
                    ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                    : "border-transparent focus:border-[#063826]/30 focus:bg-white"
                } text-[#0F1E17] placeholder-[#A0ACA5] transition-all outline-none`}
              />
            </div>
            {formik.touched.name && formik.errors.name && (
              <p className="mt-1 text-[11px] font-medium text-red-600 pl-3 text-left">{formik.errors.name}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-left text-xs font-semibold text-[#33463D] mb-1.5 pl-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8B83]">
                <Mail size={16} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="john@example.com"
                className={`w-full pl-11 pr-4 py-3 text-sm rounded-full bg-[#EFECE6]/75 border ${
                  formik.touched.email && formik.errors.email 
                    ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                    : "border-transparent focus:border-[#063826]/30 focus:bg-white"
                } text-[#0F1E17] placeholder-[#A0ACA5] transition-all outline-none`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1 text-[11px] font-medium text-red-600 pl-3 text-left">{formik.errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-left text-xs font-semibold text-[#33463D] mb-1.5 pl-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8B83]">
                <Phone size={16} />
              </span>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="10-digit mobile number"
                className={`w-full pl-11 pr-4 py-3 text-sm rounded-full bg-[#EFECE6]/75 border ${
                  formik.touched.phone && formik.errors.phone 
                    ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                    : "border-transparent focus:border-[#063826]/30 focus:bg-white"
                } text-[#0F1E17] placeholder-[#A0ACA5] transition-all outline-none`}
              />
            </div>
            {formik.touched.phone && formik.errors.phone && (
              <p className="mt-1 text-[11px] font-medium text-red-600 pl-3 text-left">{formik.errors.phone}</p>
            )}
          </div>

          {/* Password & Confirm Side-by-Side Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Password */}
            <div>
              <label className="block text-left text-xs font-semibold text-[#33463D] mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8B83]">
                  <Lock size={15} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-3 py-3 text-sm rounded-full bg-[#EFECE6]/75 border ${
                    formik.touched.password && formik.errors.password 
                      ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                      : "border-transparent focus:border-[#063826]/30 focus:bg-white"
                  } text-[#0F1E17] placeholder-[#A0ACA5] transition-all outline-none`}
                />
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="mt-1 text-[10px] font-medium text-red-600 pl-2 text-left">{formik.errors.password}</p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-left text-xs font-semibold text-[#33463D] mb-1.5 pl-1">
                Confirm
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8B83]">
                  <KeyRound size={15} />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-3 py-3 text-sm rounded-full bg-[#EFECE6]/75 border ${
                    formik.touched.confirmPassword && formik.errors.confirmPassword 
                      ? "border-red-400 focus:border-red-500 bg-red-50/30" 
                      : "border-transparent focus:border-[#063826]/30 focus:bg-white"
                  } text-[#0F1E17] placeholder-[#A0ACA5] transition-all outline-none`}
                />
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="mt-1 text-[10px] font-medium text-red-600 pl-2 text-left">{formik.errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-[#4A5D54] cursor-pointer text-left pl-1 select-none">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="h-4 w-4 rounded-full accent-[#063826] cursor-pointer"
              />
              <span>
                I agree to the <span className="font-semibold underline">Terms of Service</span> and <span className="font-semibold underline">Privacy Policy</span>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3.5 rounded-full bg-[#063826] hover:bg-[#042418] active:scale-[0.99] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#063826]/20 cursor-pointer disabled:opacity-70"
            >
              {formik.isSubmitting ? "Sending OTP..." : "Create Account"}
              {!formik.isSubmitting && <ArrowRight size={16} />}
            </button>
          </div>

          {/* Already have an account link */}
          <div className="pt-3 text-center text-xs text-[#5D6F66]">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-[#063826] hover:underline"
            >
              Sign In
            </button>
          </div>
        </form>

        {/* Bottom Decorative Tagline */}
        <div className="mt-6 border-t border-black/5 pt-3 text-center">
          <span className="text-[9px] tracking-[0.2em] font-semibold text-[#90A197] uppercase">
            ─── PREMIUM FARM-TO-TABLE LOGISTICS ───
          </span>
        </div>
      </div>

      {/* OTP Verification Modal */}
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