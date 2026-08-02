const express = require("express");
const router = express.Router();

const { uploadDriverDocs } = require("../../middleware/uploadDriverDocs");
const { uploadStoreDocs } = require("../../middleware/uploadStoreDocs");

const validateBody = require("../../middleware/validateBody");
const { loginRateLimiter, otpRateLimiter } = require("../../middleware/authRateLimiter");

const {
  loginSchema,
  customerRegisterSchema,
  driverRegisterSchema,
  storeRegisterSchema,
} = require("../../validators/authValidators");

const {
  CustomerRegister,
  registerDriver,
  registerStore,
} = require("../../controllers/auth/registrationController");

const {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  resendForgotPasswordOtp,
} = require("../../controllers/auth/forgotPasswordController");

const {
  verifyOtpController,
  resendOTPController,
} = require("../../controllers/auth/otpController");

const { Login, logoutUser } = require("../../controllers/auth/loginController");

const tokenRegenerate = require("../../services/tokenRegenerate");

const { getMe } = require("../../controllers/auth/authMe");
const protectRoutes = require("../../middleware/protectRoutes");

router.get("/me", protectRoutes, getMe);

// Customer Registration
router.post("/register/customer", validateBody(customerRegisterSchema), CustomerRegister);

// Driver Registration
router.post(
  "/register/driver",
  uploadDriverDocs,
  validateBody(driverRegisterSchema),
  registerDriver
);

// Store Registration
router.post(
  "/register/store",
  uploadStoreDocs,
  validateBody(storeRegisterSchema),
  registerStore
);

// Forgot Password Routes
router.post("/forgot-password/send-otp", otpRateLimiter, sendForgotPasswordOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);
router.post("/forgot-password/resend-otp", otpRateLimiter, resendForgotPasswordOtp);
router.post("/forgot-password/reset", resetPassword);

// Common OTP Routes
router.post("/register/verify-otp", verifyOtpController);
router.post("/register/resend-otp", otpRateLimiter, resendOTPController);

// Login Route with Rate Limiter & Zod Validation
router.post("/login", loginRateLimiter, validateBody(loginSchema), Login);

router.post("/logout", protectRoutes, logoutUser);

router.post("/refresh", tokenRegenerate);

module.exports = router;
