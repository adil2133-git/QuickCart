const express = require("express");
const router = express.Router();

const { uploadDriverDocs } = require("../../middleware/upload");
const { uploadStoreDocs } = require("../../middleware/uploadStore")

const {
  CustomerRegister,
  registerDriver,
  registerStore
} = require("../../controllers/auth/registrationController");

const {
  verifyOtpController,
  resendOTPController,
} = require("../../controllers/auth/otpController");

const { Login } = require("../../controllers/auth/loginController");

const { getMe } = require("../../controllers/auth/authMe");
const protectRoutes = require("../../middleware/protectRoute");

router.get("/me", protectRoutes, getMe)

// Customer Registration
router.post("/register/customer", CustomerRegister);

// Driver Registration
router.post(
  "/register/driver",
  uploadDriverDocs,
  registerDriver
);

// Store Registration
router.post(
  "/register/store",
  uploadStoreDocs,
  registerStore
);

// Common OTP Routes
router.post("/register/verify-otp", verifyOtpController);
router.post("/register/resend-otp", resendOTPController);

// Login
router.post("/login", Login);

module.exports = router;