const bcrypt = require("bcryptjs");
const User = require("../../models/shared/user");
const DriverProfile = require("../../models/driver/driverProfile");
const generateToken = require("../../utils/generateToken");
const { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } = require("../../utils/cookieOptions");

const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const lowerEmail = email.toLowerCase();

        const user = await User.findOne({ email: lowerEmail });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.blocked) {
            return res.status(403).json({ message: "Your account has been blocked" });
        }

        // Drivers go through an approval process, so they need extra status checks other roles don't
        if (user.role === "DRIVER") {
            if (user.status === "REJECTED") {
                return res.status(403).json({
                    message: "Your driver application was rejected. Please contact support for more details.",
                    status: user.status,
                });
            }

            if (user.status === "SUSPENDED") {
                return res.status(403).json({
                    message: "Your driver account has been suspended. Please contact support.",
                    status: user.status,
                });
            }
        }

        const { AccessToken, RefreshToken } = generateToken(user.email, user._id, user.role);

        res
            .cookie("Access_Token", AccessToken, ACCESS_COOKIE_OPTIONS)
            .cookie("Refresh_Token", RefreshToken, REFRESH_COOKIE_OPTIONS)
            .status(200)
            .json({
                message: "Login successful",
                token: AccessToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status || "ACTIVE",
                },
            });
    } catch (err) {
        console.log("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Internal server error", Error: err.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        // Force driver availability to OFFLINE so the next login doesn't restore a stale ONLINE status
        if (req.user?.role === "DRIVER") {
            await DriverProfile.findOneAndUpdate(
                { userId: req.user.userID },
                { availabilityStatus: "OFFLINE" }
            ).catch((err) => console.error("[logout] Failed to set driver OFFLINE:", err));
        }

        res
            .clearCookie("Access_Token", ACCESS_COOKIE_OPTIONS)
            .clearCookie("Refresh_Token", REFRESH_COOKIE_OPTIONS)
            .status(200)
            .json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("LOGOUT ERROR:", err);
        return res.status(500).json({ message: "Internal server error", Error: err.message });
    }
};

module.exports = { Login, logoutUser };