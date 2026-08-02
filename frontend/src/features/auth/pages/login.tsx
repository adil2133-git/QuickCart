import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import ForgotPasswordModal from "../components/forgotPasswordModal";
import CreateAccountModal from "../components/createAccountModal";
import api from "../../../api/axios";
import { getApiErrorMessage, getApiErrorStatus, getApiErrorTitle } from "../../../api/apiError";
import { useAuthStore, type UserRole, type UserStatus } from "../state/authState";
import { loginValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";
import { ShoppingBag, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

// Uploaded background asset
import loginBgImg from "../../../assets/login-bg.webp";

const ROLE_ROUTES: Record<string, string> = {
  CUSTOMER: "/customer/home",
  ADMIN: "/admin/dashboard",
  DRIVER: "/driver/dashboard",
  STORE: "/store/dashboard",
};

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status?: string;
  };
}

export default function QuickKartLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverErrorTitle, setServerErrorTitle] = useState("");

  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError("");
      setServerErrorTitle("");

      try {
        const { data } = await api.post<LoginResponse>("/auth/login", {
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });

        const { id, name, email: userEmail, role, status } = data.user;
        const normalizedRole = role as UserRole;
        setUser({ id, name, email: userEmail, role: normalizedRole, status: status as UserStatus | undefined });

        showSuccessToast("Login Successful", { subtitle: `Welcome back, ${name}!` });

        if (status === "PENDING_APPROVAL") {
          if (role === "DRIVER") { navigate("/driver/pending"); return; }
          if (role === "STORE")  { navigate("/store/pending");  return; }
        }

        navigate(ROLE_ROUTES[role] || "/");

      } catch (err: unknown) {
        const status = getApiErrorStatus(err);
        const errMsg = getApiErrorMessage(err, "Invalid email or password. Please try again.");
        const errTitle = getApiErrorTitle(err);

        // Routing matrix: Rate Limit (429) triggers Toast, Auth/Status failures render in-card Banner
        if (status === 429) {
          showErrorToast("Too Many Attempts", { subtitle: errMsg });
        } else {
          setServerErrorTitle(errTitle || (status === 403 ? "Account Notice" : "Login Failed"));
          setServerError(errMsg);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#F0F2ED] font-sans text-[#16241D]">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      {showCreateAccount && <CreateAccountModal onClose={() => setShowCreateAccount(false)} />}

      {/* Full-Screen Background Image with Soft Lighting */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <img
          src={loginBgImg}
          alt="Sunlit Kitchen Produce Background"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-center opacity-85 transition-opacity duration-300"
        />
        {/* Soft Radial & Linear Vignette Overlay matching reference design */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-white/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-[#F0F2ED]/60" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-12 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-12">

          {/* Left Column: Brand Headline & Statement */}
          <div className="flex flex-col justify-center lg:col-span-6">
            {/* Brand Logo Header */}
            <Link to="/" className="mb-10 inline-flex items-center gap-1">
              <span className="text-2xl font-bold tracking-tight text-[#0A1F17]" style={{ fontFamily: "Fraunces, serif" }}>
                QuickKart<span className="text-[#145C43]">•</span>
              </span>
            </Link>

            {/* Headline */}
            <h1
              className="text-4xl leading-[1.1] tracking-tight text-[#0A1F17] sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "Fraunces, serif", fontWeight: 480 }}
            >
              The luxury of <br />
              freshness <br />
              <span className="italic font-serif text-[#145C43]">delivered.</span>
            </h1>

            {/* Subtitle Copy */}
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[#6E7C74] md:text-base">
              Experience farm-to-table logistics refined for the modern epicurean. High-fidelity flavor, exactly when you need it.
            </p>
          </div>

          {/* Right Column: Floating Glassmorphic Login Card */}
          <div className="flex justify-center lg:col-span-6 lg:justify-end">
            <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/80 bg-white/65 p-8 shadow-2xl backdrop-blur-2xl md:p-10">
              
              {/* Top Right Shopping Bag Icon */}
              <div className="absolute right-8 top-8 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8EFEC]/80 text-[#145C43] backdrop-blur-md">
                <ShoppingBag size={20} />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl font-semibold text-[#0A1F17] md:text-3xl" style={{ fontFamily: "Fraunces, serif" }}>
                Welcome Back
              </h2>
              <p className="mt-1 text-xs text-[#6E7C74] md:text-sm">
                Please enter your credentials to access your pantry.
              </p>

              {/* In-Card Server Error Alert Banner */}
              {serverError && (
                <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                  <div>
                    {serverErrorTitle && (
                      <p className="font-bold text-red-800" style={{ fontFamily: "Fraunces, serif" }}>
                        {serverErrorTitle}
                      </p>
                    )}
                    <p className="mt-0.5 leading-relaxed">{serverError}</p>
                  </div>
                </div>
              )}

              {/* Formik Login Form */}
              <form onSubmit={formik.handleSubmit} className="mt-6 space-y-5" noValidate>
                {/* Email Address Input */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#0A1F17]">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="name@example.com"
                    className={`w-full rounded-full border bg-white/50 px-5 py-3 text-sm text-[#16241D] placeholder-[#9BAAA1] outline-none backdrop-blur-md transition-all ${
                      formik.touched.email && formik.errors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                        : "border-white/80 focus:border-[#145C43] focus:bg-white/90 focus:ring-2 focus:ring-[#145C43]/15"
                    }`}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 pl-4 text-[11px] font-medium text-red-600">
                      {formik.errors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#0A1F17]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs font-semibold text-[#145C43] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter password (min. 8 characters)"
                      className={`w-full rounded-full border bg-white/50 px-5 py-3 pr-12 text-sm text-[#16241D] placeholder-[#9BAAA1] outline-none backdrop-blur-md transition-all ${
                        formik.touched.password && formik.errors.password
                          ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                          : "border-white/80 focus:border-[#145C43] focus:bg-white/90 focus:ring-2 focus:ring-[#145C43]/15"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E7C74] hover:text-[#16241D]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1 pl-4 text-[11px] font-medium text-red-600">
                      {formik.errors.password}
                    </p>
                  )}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#0A1F17] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#145C43] hover:shadow-xl active:bg-[#0E402F] disabled:opacity-70"
                >
                  {formik.isSubmitting ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Access Your Account <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Card Divider & Register Link */}
              <div className="mt-8 border-t border-[#E3E7E1]/80 pt-6 text-center text-xs text-[#6E7C74]">
                New to QuickKart?{" "}
                <button
                  type="button"
                  onClick={() => setShowCreateAccount(true)}
                  className="font-bold text-[#0A1F17] hover:underline"
                >
                  Create an Account
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Page Footer Bar */}
      <footer className="relative z-10 border-t border-[#E3E7E1]/60 px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-[11px] text-[#6E7C74] sm:flex-row">
          <p>© 2024 QuickKart Logistics. Premium Farm-to-Table.</p>
          <div className="flex items-center gap-4 font-medium">
            <span className="hover:text-[#16241D] cursor-pointer">Sustainability</span>
            <span>•</span>
            <span className="hover:text-[#16241D] cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}