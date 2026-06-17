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



// POST /api/delivery-partners/register
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

        // ── 1. Validate text fields ───────────────────────────────────────────────
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

        // ── 2. Duplicate check ────────────────────────────────────────────────────
        const lowerEmail = email.toLowerCase();

        const emailExists = await User.findOne({ email: lowerEmail });
        if (emailExists) {
            return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }

        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(409).json({ success: false, message: "Phone number is already registered." });
        }

        // ── 3. Collect Cloudinary URLs from req.files ─────────────────────────────
        const files = req.files || {};

        const drivingLicense = files.drivingLicense?.[0]?.path || null;
        const vehicleRC = files.vehicleRC?.[0]?.path || null;
        const profilePhoto = files.profilePhoto?.[0]?.path || null;

        const documentUrls = [drivingLicense, vehicleRC, profilePhoto].filter(Boolean);

        // ── 4. Hash password & store everything in Redis ──────────────────────────
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

        // ── 5. Send OTP ───────────────────────────────────────────────────────────
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
    let createdUser = null;

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

        // Basic presence checks
        if (!storeName || !ownerName || !address || !pincode || !email || !phone || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const lowerEmail = email.toLowerCase().trim();

        // Check for existing user with same email or phone
        const existingUser = await User.findOne({
            $or: [{ email: lowerEmail }, { phone }],
        });

        if (existingUser) {
            return res.status(409).json({ message: "An account with this email or phone already exists" });
        }

        // Pull uploaded document URLs from multer + Cloudinary
        const tradeLicenseUrl = req.files?.tradeLicense?.[0]?.path || null;
        const ownerIdUrl      = req.files?.ownerId?.[0]?.path || null;
        const storeFrontUrl   = req.files?.storeFront?.[0]?.path || null;

        if (!tradeLicenseUrl || !ownerIdUrl || !storeFrontUrl) {
            return res.status(400).json({ message: "Trade license, owner ID, and store front photo are all required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the User first
        createdUser = await User.create({
            name: ownerName,
            phone,
            email: lowerEmail,
            password: hashedPassword,
            role: "STORE",
            status: "PENDING_APPROVAL",
        });

        // Then the StoreProfile, linked via userId
        const storeProfile = await StoreProfile.create({
            userId: createdUser._id,
            storeName: storeName.trim(),
            ownerName,
            address,
            pincode,
            tradeLicenseUrl,
            ownerIdUrl,
            storeFrontUrl,
        });

        return res.status(201).json({
            success: true,
            message: "Store application submitted. Your account is pending admin approval.",
            user: {
                id: createdUser._id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                status: createdUser.status,
            },
        });

    } catch (err) {
        // Roll back the User if StoreProfile creation failed partway through
        if (createdUser) {
            await User.findByIdAndDelete(createdUser._id).catch(() => {});
        }

        console.error("STORE REGISTRATION ERROR:", err);

        if (err.code === 11000) {
            return res.status(409).json({ message: "An account with this email or phone already exists" });
        }

        return res.status(500).json({ message: "Internal server error", Error: err.message });
    }
};



module.exports = { CustomerRegister, registerDriver, registerStore };