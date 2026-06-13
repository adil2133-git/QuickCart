const transporter = require("../config/mail");
const generateOTP = require("../utils/generateOtp");
const { client } = require("../config/redis");
require("dotenv").config();

const OTP_EXPIRY = 120; // 2 minutes

const sendOtp = async (email) => {
    try {
        const existingOtp = await client.get(`otp:${email}`);
        if (existingOtp) {
            return {
                success: false,
                message: "OTP already sent. Try again later"
            };
        }

        const otp = generateOTP();

        await client.setEx(`otp:${email}`, OTP_EXPIRY, otp);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code - QuickKart",
            text: `Your OTP is ${otp}. It is valid for 2 minutes.`
        });

        return { success: true };
    } catch (err) {
        console.log("send otp error", err);
        return { success: false, message: "Failed to send OTP", Error: err.message };
    }
};

const resendOtp = async (email) => {
    try {
        await client.del(`otp:${email}`);

        const otp = generateOTP();
        await client.setEx(`otp:${email}`, OTP_EXPIRY, otp);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code - QuickKart",
            text: `Your OTP is ${otp}. It is valid for 2 minutes.`
        });

        return { success: true };
    } catch (err) {
        console.log("resend otp error", err);
        return { success: false, message: "Failed to resend OTP", Error: err.message };
    }
};

const verifyOtp = async (email, userOtp) => {
    try {
        const storedOtp = await client.get(`otp:${email}`);

        if (!storedOtp) {
            return { success: false, message: "OTP expired or not found" };
        }

        if (storedOtp === userOtp) {
            await client.del(`otp:${email}`);
            return { success: true };
        }

        return { success: false, message: "Invalid OTP" };
    } catch (err) {
        console.log("Verify OTP Error:", err);
        return { success: false, message: "Something went wrong", Error: err.message };
    }
};

module.exports = { sendOtp, resendOtp, verifyOtp };