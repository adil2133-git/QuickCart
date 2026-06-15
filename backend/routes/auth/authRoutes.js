const express = require("express")
const router = express.Router()

const { CustomerRegister } = require("../../controllers/auth/registrationController")
const { verifyOtpController, resendOTPController } = require("../../controllers/auth/otpController")
const { Login } = require("../../controllers/auth/loginController")

router.post("/register", CustomerRegister);
router.post("/register/verify-otp", verifyOtpController);
router.post("/register/resend-otp", resendOTPController);
router.post("/login", Login)

module.exports = router