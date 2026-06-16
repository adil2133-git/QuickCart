const express = require("express");
const router = express.Router();

const { uploadDriverDocs } = require("../../middleware/upload");

const { registerDriver } = require("../../controllers/auth/registrationController");
const {
  verifyOtpController,
  resendOTPController,
} = require("../../controllers/auth/otpController");

router.post(
  "/register",
  uploadDriverDocs,
  registerDriver
);

router.post("/register/verify-otp", verifyOtpController);
router.post("/register/resend-otp", resendOTPController);

module.exports = router;