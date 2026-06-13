const express = require("express")
const router = express.Router()

const {
    RegisterController,
    verifyOtpController,
    resendOTPController
} = require("../../controllers/auth/registrationController")