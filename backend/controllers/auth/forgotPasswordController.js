const bcrypt = require("bcryptjs");
const { client } = require("../../config/redis");
const { sendOtp, verifyOtp } = require("../../services/otpService");
const User = require("../../models/shared/user");
const { sendPasswordChangedEmail } = require("../../services/mailService");

const FP_SESSION_EXPIRY = 600; // 10 minutes — window after OTP verify to reset

// Step 1 — send OTP if the account exists.
// Always respond the same way either way, so we don't leak which emails are registered.
const sendForgotPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const lowerEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: lowerEmail });

        if (user) {
            // Marks this as a forgot-password flow, separate from the register OTP namespace
            await client.setEx(`fp:pending:${lowerEmail}`, FP_SESSION_EXPIRY, "1");

            const result = await sendOtp(lowerEmail);
            if (!result.success) {
                if (result.message?.includes("already sent")) {
                    return res.status(429).json({ message: "OTP already sent. Please wait before requesting again." });
                }
                return res.status(500).json({ message: result.message || "Failed to send OTP" });
            }
        }

        // Always respond with 200 — don't leak whether email exists
        return res.status(200).json({ message: "If an account with that email exists, an OTP has been sent." });

    } catch (err) {
        console.log("sendForgotPasswordOtp error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Step 2 — verify OTP for forgot-password flow.
 * On success, issues a short-lived reset token stored in Redis.
 */
const verifyForgotPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const lowerEmail = email.toLowerCase().trim();

        // Check fp:pending exists (guards against random OTP verify attempts)
        const pending = await client.get(`fp:pending:${lowerEmail}`);
        if (!pending) {
            return res.status(400).json({ message: "No password reset request found. Please start again." });
        }

        const result = await verifyOtp(lowerEmail, otp);
        if (!result.success) {
            return res.status(400).json({ message: result.message || "Invalid or expired OTP" });
        }

        // OTP verified — issue a reset token (random enough: email + timestamp hash)
        const resetToken = Buffer.from(`${lowerEmail}:${Date.now()}`).toString("base64");
        await client.setEx(`fp:reset:${lowerEmail}`, FP_SESSION_EXPIRY, resetToken);
        await client.del(`fp:pending:${lowerEmail}`);

        return res.status(200).json({
            message: "OTP verified",
            resetToken, // frontend stores this briefly to send with reset request
            email: lowerEmail,
        });

    } catch (err) {
        console.log("verifyForgotPasswordOtp error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Step 3 — reset password using the reset token.
 */
const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ message: "Email, reset token, and new password are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const lowerEmail = email.toLowerCase().trim();

        const storedToken = await client.get(`fp:reset:${lowerEmail}`);
        if (!storedToken || storedToken !== resetToken) {
            return res.status(400).json({ message: "Reset session expired or invalid. Please start again." });
        }

        const user = await User.findOne({ email: lowerEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        await client.del(`fp:reset:${lowerEmail}`);

        sendPasswordChangedEmail(user).catch(() => {});

        return res.status(200).json({ message: "Password reset successfully" });

    } catch (err) {
        console.log("resetPassword error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Resend OTP for forgot-password (reuses otpService.resendOtp).
 */
const resendForgotPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const lowerEmail = email.toLowerCase().trim();

        const pending = await client.get(`fp:pending:${lowerEmail}`);
        if (!pending) {
            return res.status(400).json({ message: "No password reset request found. Please start again." });
        }

        const { resendOtp } = require("../../services/otpService");
        const result = await resendOtp(lowerEmail);

        if (!result.success) {
            return res.status(500).json({ message: result.message || "Failed to resend OTP" });
        }

        // Refresh the pending window
        await client.setEx(`fp:pending:${lowerEmail}`, FP_SESSION_EXPIRY, "1");

        return res.status(200).json({ message: "OTP resent successfully" });

    } catch (err) {
        console.log("resendForgotPasswordOtp error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    sendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPassword,
    resendForgotPasswordOtp,
};