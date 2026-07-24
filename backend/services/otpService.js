const transporter = require("../config/mail");
const generateOTP = require("../utils/generateOtp");
const { client } = require("../config/redis");
require("dotenv").config();

const OTP_EXPIRY = 120; // 2 minutes in seconds

// Sends a new OTP to the specified email if not already sent recently
const sendOtp = async (email) => {
    try {
        // Prevent spamming by checking if an active OTP already exists in Redis
        const existingOtp = await client.get(`otp:${email}`);
        if (existingOtp) {
            return {
                success: false,
                message: "OTP already sent. Try again later"
            };
        }

        const otp = generateOTP();

        // Cache the OTP in Redis with a 2-minute expiration
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

// Deletes any existing OTP and forces a fresh generation/send
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

// Verifies the user-supplied OTP against Redis and deletes it on success
const verifyOtp = async (email, userOtp) => {
    try {
        const storedOtp = await client.get(`otp:${email}`);

        if (!storedOtp) {
            return { success: false, message: "OTP expired or not found" };
        }

        if (storedOtp === userOtp) {
            // Delete OTP immediately on successful verification to prevent reuse
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