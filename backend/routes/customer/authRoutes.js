const express = require("express")
const router = express.Router()

const {
    RegisterController,
    verifyOtpController,
    resendOTPController
} = require("../../controllers/auth/registrationController")

router.post("/register", RegisterController);
router.post("/register/verify-otp", verifyOtpController);
router.post("/register/resend-otp", resendOTPController);

module.exports = router