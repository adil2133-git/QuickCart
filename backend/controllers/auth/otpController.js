const { client } = require("../../config/redis");
const { verifyOtp, resendOtp } = require("../../services/otpService");
const User = require("../../models/shared/user");
const DriverProfile = require("../../models/driver/driverProfile"); 
const StoreProfile = require("../../models/store/storeProfile")
const generateToken = require("../../utils/generateToken");
const { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } = require("../../utils/cookieOptions");



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

        const {
            name,
            phone,
            password,
            role,
            vehicleType,
            vehicleNumber,
            licenseNumber,
            documentUrls,
            storeName,
            ownerName,
            address,
            pincode,
            lat,   
            lng,   
        } = JSON.parse(userData);

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
            role,
            ...(["DRIVER", "STORE"].includes(role) && { status: "PENDING_APPROVAL" })
        });

        // If driver, also create DriverProfile
        if (role === "DRIVER") {
            await DriverProfile.create({
                userId: newUser._id,
                vehicleType,
                vehicleNumber,
                licenseNumber,
                documentUrls,
            });
        }

        // If store, also create StoreProfile
        if (role === "STORE") {
            await StoreProfile.create({
                userId:    newUser._id,
                storeName,
                ownerName,
                address,
                pincode,
                documentUrls,
                // ── Write coordinates to the model ─────────────────────────
                // StoreProfile.coordinates = { lat, lng }
                // The 2dsphere index on this field powers nearby-store queries.
                coordinates: {
                    lat: lat ?? 0,
                    lng: lng ?? 0,
                },
            });
        }

        await client.del(`register:${lowerEmail}`);

        const { AccessToken, RefreshToken } = generateToken(newUser.email, newUser._id, newUser.role);

        return res
            .cookie("Access_Token", AccessToken, ACCESS_COOKIE_OPTIONS)
            .cookie("Refresh_Token", RefreshToken, REFRESH_COOKIE_OPTIONS)
            .status(201)
            .json({
                message: "User registered successfully",
                user: {
                    id:     newUser._id,
                    name:   newUser.name,
                    phone:  newUser.phone,
                    email:  newUser.email,
                    role:   newUser.role,
                    status: newUser.status || "ACTIVE",
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

module.exports = { verifyOtpController, resendOTPController }