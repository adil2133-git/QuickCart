const bcrypt = require("bcryptjs");
const { client } = require("../../config/redis");
const { sendOtp } = require("../../services/otpService");
const User = require("../../models/shared/user");
const DriverProfile = require("../../models/driver/driverProfile");
const StoreProfile = require("../../models/store/storeProfile")


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



const registerDriver = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            confirmPassword,
            vehicleType,
            vehicleNumber,
            licenseNumber,
        } = req.body;

        if (!name || !phone || !email || !password || !confirmPassword || !vehicleType || !vehicleNumber || !licenseNumber) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
        }

        const validVehicles = ["Bike", "Scooter"];
        if (!validVehicles.includes(vehicleType)) {
            return res.status(400).json({ success: false, message: `vehicleType must be one of: ${validVehicles.join(", ")}` });
        }

        const lowerEmail = email.toLowerCase();

        const emailExists = await User.findOne({ email: lowerEmail });
        if (emailExists) {
            return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }

        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(409).json({ success: false, message: "Phone number is already registered." });
        }

        // Collect Cloudinary URLs from req.files 
        const files = req.files || {};

        const drivingLicense = files.drivingLicense?.[0]?.path || null;
        const vehicleRC = files.vehicleRC?.[0]?.path || null;
        const profilePhoto = files.profilePhoto?.[0]?.path || null;

        const documentUrls = [drivingLicense, vehicleRC, profilePhoto].filter(Boolean);

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.setEx(
            `register:${lowerEmail}`,
            120,
            JSON.stringify({
                name,
                phone,
                email: lowerEmail,
                password: hashedPassword,
                role: "DRIVER",
                vehicleType,
                vehicleNumber,
                licenseNumber,
                documentUrls,
            })
        );

        const result = await sendOtp(lowerEmail);

        if (!result.success) {
            return res.status(429).json({ success: false, message: result.message || "Failed to send OTP" });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent. Please verify your email to complete registration.",
            email: lowerEmail,
        });

    } catch (err) {
        console.error("[registerDriver]", err);

        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || "field";
            return res.status(409).json({ success: false, message: `An account with this ${field} already exists.` });
        }

        return res.status(500).json({ success: false, message: "Server error during registration.", error: err.message });
    }
};


const registerStore = async (req, res) => {
    try {
        const {
            storeName,
            ownerName,
            address,
            pincode,
            email,
            phone,
            password,
            confirmPassword,
        } = req.body;

        if (!storeName || !ownerName || !address || !pincode || !email || !phone || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
        }

        const lowerEmail = email.toLowerCase();

        const emailExists = await User.findOne({ email: lowerEmail });
        if (emailExists) {
            return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }

        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(409).json({ success: false, message: "Phone number is already registered." });
        }

        //Collect Cloudinary URLs from req.files 
        const files = req.files || {};

        const tradeLicense = files.tradeLicense?.[0]?.path || null;
        const ownerId      = files.ownerId?.[0]?.path || null;
        const storeFront   = files.storeFront?.[0]?.path || null;

        const documentUrls = [tradeLicense, ownerId, storeFront].filter(Boolean);

        if (documentUrls.length < 3) {
            return res.status(400).json({ success: false, message: "Trade license, owner ID, and store front photo are all required." });
        }

        // ── 4. Hash password & store everything in Redis ──────────────────────────
        const hashedPassword = await bcrypt.hash(password, 10);

        await client.setEx(
            `register:${lowerEmail}`,
            120,
            JSON.stringify({
                name: ownerName,
                phone,
                email: lowerEmail,
                password: hashedPassword,
                role: "STORE",
                storeName,
                ownerName,
                address,
                pincode,
                documentUrls,
            })
        );

        const result = await sendOtp(lowerEmail);

        if (!result.success) {
            return res.status(429).json({ success: false, message: result.message || "Failed to send OTP" });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent. Please verify your email to complete registration.",
            email: lowerEmail,
        });

    } catch (err) {
        console.error("[registerStore]", err);

        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || "field";
            return res.status(409).json({ success: false, message: `An account with this ${field} already exists.` });
        }

        return res.status(500).json({ success: false, message: "Server error during registration.", error: err.message });
    }
};



module.exports = { CustomerRegister, registerDriver, registerStore };