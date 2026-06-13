const bcrypt = require("bcryptjs");
const { client } = require("../../config/redis");
const { sendOtp, verifyOtp, resendOtp } = require("../../services/otpService");
const User = require("../../models/shared/user");

const RegisterController = async (req, res) => {
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


const verifyOtpController = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const lowerEmail = email.toLowerCase();

        const result = await verifyOtp(lowerEmail, otp);

        if (!result.success) {
            return res.status(400).json({ message: result.message || "Invalid or expired OTP" });
        }

        const userData = await client.get(`register:${lowerEmail}`);

        if (!userData) {
            return res.status(400).json({ message: "Registration session expired" });
        }

        const { name, phone, password, role } = JSON.parse(userData);

        const existingUser = await User.findOne({ email: lowerEmail });
        if (existingUser) {
            await client.del(`register:${lowerEmail}`);
            return res.status(409).json({ message: "Email is already registered" });
        }

        const newUser = await User.create({
            name,
            phone,
            email: lowerEmail,
            password,
            role
        });

        await client.del(`register:${lowerEmail}`);

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: newUser._id,
                name: newUser.name,
                phone: newUser.phone,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (err) {
        console.log("VERIFY OTP ERROR:", err);
        return res.status(500).json({ message: "Internal server error", Error: err.message });
    }
};


const resendOTPController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const lowerEmail = email.toLowerCase();

        const pendingData = await client.get(`register:${lowerEmail}`);
        if (!pendingData) {
            return res.status(400).json({ message: "Registration session expired. Please register again." });
        }

        const result = await resendOtp(lowerEmail);

        if (!result.success) {
            return res.status(429).json({ message: result.message });
        }

        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


module.exports = { RegisterController, verifyOtpController, resendOTPController };