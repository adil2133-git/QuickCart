const bcrypt = require("bcryptjs");
const { client } = require("../../config/redis");
const { sendOtp } = require("../../services/otpService");
const User = require("../../models/shared/user");

const CustomerRegister = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!name || !phone || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (name.trim().length < 3) {
            return res.status(400).json({ message: "Name must be at least 3 characters" });
        }

        const lowerEmail = email.toLowerCase();

        const userExists = await User.findOne({ email: lowerEmail });
        if (userExists) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(409).json({ message: "Phone number is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.setEx(
            `register:${lowerEmail}`,
            120,
            JSON.stringify({
                name,
                phone,
                email: lowerEmail,
                password: hashedPassword,
                role: "CUSTOMER"
            })
        );

        const result = await sendOtp(lowerEmail);

        if (!result.success) {
            return res.status(429).json({ message: result.message || "Failed to send OTP" });
        }

        return res.status(200).json({ message: "OTP sent. Please verify to complete registration", email: lowerEmail });

    } catch (err) {
        console.log("REGISTER ERROR:", err);
        return res.status(500).json({ message: "Internal server error", Error: err.message });
    }
};





module.exports = { CustomerRegister};