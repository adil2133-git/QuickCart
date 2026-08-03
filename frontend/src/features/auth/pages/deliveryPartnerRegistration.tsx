import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { Bike, Scooter, ArrowRight, Info, Upload, CheckCircle2 } from "lucide-react";
import { registerDriver } from "../../driver/driverAuthService";
import { getApiErrorMessage } from "../../../api/apiError";
import OtpVerificationModal from "../components/otpVerificationModal";
import PasswordStrengthBar from "../components/shared/passwordStrengthBar";
import { driverRegisterValidationSchema } from "../validation/authSchemas";
import { showSuccessToast, showErrorToast } from "../../../components/ui/toastService";

// Optional left panel background asset if added later
import driverRegBg from "../../../assets/driver_reg_bg.webp";

type VehicleType = "Bike" | "Scooter";

interface UploadState {
  file: File | null;
  name: string | null;
  uploaded: boolean;
}

function DocumentUploadZone({
  label,
  sub,
  upload,
  onUpload,
}: {
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
      className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
        uploaded 
          ? "border-[#063826] bg-[#E2EDE7]/60 text-[#063826]" 
          : "border-[#DCE3DC] bg-[#FAFAF8] hover:bg-[#F2F0EB] text-[#6E7C74]"
      }`}
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
      
      {uploaded ? (
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 size={24} className="text-[#063826] mb-1" />
          <span className="text-xs font-bold text-[#063826]">{label}</span>
          <span className="text-[11px] text-[#2C4E3F] truncate max-w-[140px] font-medium">{name}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <Upload size={20} className="text-[#8AA094] mb-1.5" />
          <span className="text-xs font-semibold text-[#1A3326]">{label}</span>
          <span className="text-[10px] text-[#7A8C82] mt-0.5">{sub}</span>
        </div>
      )}
    </div>
  );
}

export default function DeliveryPartnerRegistration() {
  const navigate = useNavigate();

  const [drivingLicense, setDrivingLicense] = useState<UploadState>({ file: null, name: null, uploaded: false });
  const [vehicleRC, setVehicleRC] = useState<UploadState>({ file: null, name: null, uploaded: false });
  const [profilePhoto, setProfilePhoto] = useState<UploadState>({ file: null, name: null, uploaded: false });

  const [apiError, setApiError] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);

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
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-[#F9F8F6]">
      
      {/* Left Panel: Hero Branding & Image Area */}
      <aside className="hidden md:flex flex-col justify-between w-[38%] lg:w-[40%] h-full p-8 lg:p-10 relative overflow-hidden bg-[#063826] text-white flex-shrink-0">
        
        {/* Full Image Background matching reference design */}
        <div className="absolute inset-0 z-0">
          <img 
            src={driverRegBg} 
            alt="QuickKart Delivery Partner" 
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle bottom vignette gradient so white text is 100% crisp */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Top Spacer */}
        <div className="relative z-10" />

        {/* Bottom Hero Typography & Statement */}
        <div className="relative z-10 mt-auto">
          <h1 
            className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2" 
            style={{ fontFamily: "Fraunces, serif" }}
          >
            QuickKart
          </h1>
          <p className="text-sm lg:text-base text-white/90 font-normal leading-relaxed max-w-sm">
            Join our community of logistics champions and start your journey today.
          </p>
        </div>
      </aside>

      {/* Right Panel: Scrollable Form Area */}
      <main className="flex-1 h-full overflow-y-auto p-6 sm:p-10 lg:p-12">
        <div className="max-w-[540px] mx-auto">

          {/* Heading */}
          <div className="mb-4">
            <h2 
              className="text-2xl sm:text-3xl font-bold text-[#063826]"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Join as a Delivery Partner
            </h2>
            <p className="text-xs sm:text-sm text-[#5D6F65] mt-1">
              Fill in your details to start your journey with QuickKart.
            </p>
          </div>

          {/* Admin Review Notice Pill */}
          <div className="flex items-center gap-3 p-3.5 mb-6 rounded-full bg-[#E2EDE7]/70 border border-[#C5DCD0] text-xs text-[#063826]">
            <Info size={18} className="shrink-0 text-[#063826]" />
            <p className="leading-tight">
              Your account will be reviewed by our admin team once submitted. We'll notify you via phone once approved.
            </p>
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div className="p-3.5 mb-5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600">
              <p>{apiError}</p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-6" noValidate>
            
            {/* Section 1: Personal Info */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#8AA094] uppercase tracking-wider">
                  ── Personal Info
                </span>
              </div>

              {/* Grid: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-left text-xs font-semibold text-[#2D3A34] mb-1 pl-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. Julian Henderson"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white border border-[#DCE3DC] text-[#063826] placeholder-[#A0ACA5] focus:border-[#063826] outline-none transition-all shadow-sm"
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-left text-xs font-semibold text-[#2D3A34] mb-1 pl-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="julian@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white border border-[#DCE3DC] text-[#063826] placeholder-[#A0ACA5] focus:border-[#063826] outline-none transition-all shadow-sm"
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.email}</p>
                  )}
                </div>
              </div>

              {/* Grid: Phone Number & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-left text-xs font-semibold text-[#2D3A34] mb-1 pl-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white border border-[#DCE3DC] text-[#063826] placeholder-[#A0ACA5] focus:border-[#063826] outline-none transition-all shadow-sm"
                  />
                  {formik.touched.phone && formik.errors.phone && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-left text-xs font-semibold text-[#2D3A34] mb-1 pl-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white border border-[#DCE3DC] text-[#063826] placeholder-[#A0ACA5] focus:border-[#063826] outline-none transition-all shadow-sm"
                  />
                  <PasswordStrengthBar password={formik.values.password} />
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.password}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-left text-xs font-semibold text-[#2D3A34] mb-1 pl-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white border border-[#DCE3DC] text-[#063826] placeholder-[#A0ACA5] focus:border-[#063826] outline-none transition-all shadow-sm"
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Section 2: Vehicle & License */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#8AA094] uppercase tracking-wider">
                  ── Vehicle & License
                </span>
              </div>

              {/* Vehicle Type Pills */}
              <div>
                <label className="block text-left text-xs font-semibold text-[#2D3A34] mb-1.5 pl-1">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => formik.setFieldValue("vehicleType", "Bike")}
                    className={`py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formik.values.vehicleType === "Bike"
                        ? "border-2 border-[#063826] bg-[#EFECE6]/80 text-[#063826] shadow-sm"
                        : "border border-[#DCE3DC] bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Bike size={16} />
                    Bike
                  </button>

                  <button
                    type="button"
                    onClick={() => formik.setFieldValue("vehicleType", "Scooter")}
                    className={`py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formik.values.vehicleType === "Scooter"
                        ? "border-2 border-[#063826] bg-[#EFECE6]/80 text-[#063826] shadow-sm"
                        : "border border-[#DCE3DC] bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Scooter size={16} />
                    Scooter
                  </button>
                </div>
              </div>

              {/* Grid: Vehicle Reg & License Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-left text-xs font-semibold text-[#2D3A34] mb-1 pl-1">
                    Vehicle Registration Number
                  </label>
                  <input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    type="text"
                    placeholder="ABC-1234"
                    value={formik.values.vehicleNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white border border-[#DCE3DC] text-[#063826] placeholder-[#A0ACA5] focus:border-[#063826] outline-none transition-all shadow-sm"
                  />
                  {formik.touched.vehicleNumber && formik.errors.vehicleNumber && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.vehicleNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-left text-xs font-semibold text-[#2D3A34] mb-1 pl-1">
                    Driving License Number
                  </label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    placeholder="DL-0987654321"
                    value={formik.values.licenseNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white border border-[#DCE3DC] text-[#063826] placeholder-[#A0ACA5] focus:border-[#063826] outline-none transition-all shadow-sm"
                  />
                  {formik.touched.licenseNumber && formik.errors.licenseNumber && (
                    <p className="mt-1 text-[10px] font-medium text-red-600 pl-2">{formik.errors.licenseNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Documents Verification */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                <span className="text-xs font-semibold text-[#8AA094] uppercase tracking-wider">
                  ── Documents Verification
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <DocumentUploadZone
                  label="Driving License"
                  sub="Front DL photo"
                  upload={drivingLicense}
                  onUpload={(f) => setDrivingLicense({ file: f, name: f.name, uploaded: true })}
                />

                <DocumentUploadZone
                  label="Vehicle RC"
                  sub="RC Certificate"
                  upload={vehicleRC}
                  onUpload={(f) => setVehicleRC({ file: f, name: f.name, uploaded: true })}
                />

                <DocumentUploadZone
                  label="Profile Photo"
                  sub="Clear headshot"
                  upload={profilePhoto}
                  onUpload={(f) => setProfilePhoto({ file: f, name: f.name, uploaded: true })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#063826] hover:bg-[#042418] active:scale-[0.99] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#063826]/20 cursor-pointer disabled:opacity-70"
              >
                {formik.isSubmitting ? "Submitting Application..." : "Submit Driver Application"}
                {!formik.isSubmitting && <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* OTP Verification Modal */}
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