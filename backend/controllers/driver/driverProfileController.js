const User = require("../../models/shared/user");
const DriverProfile = require("../../models/driver/driverProfile");

// GET /api/driver/me — requires protectRoute middleware (sets req.user.userID)
const getMyDriverProfile = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store");
        const userId = req.user.userID;

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role !== "DRIVER") {
            return res.status(403).json({ success: false, message: "This account is not a driver account" });
        }

        const driverProfile = await DriverProfile.findOne({ userId });

        if (!driverProfile) {
            return res.status(404).json({ success: false, message: "Driver profile not found" });
        }

        // documentUrls is stored in order [drivingLicense, vehicleRC, profilePhoto];
        // "submitted" just means a URL exists, since per-document review isn't tracked yet.
        const documents = [
            { label: "Driving License", key: "drivingLicense", submitted: Boolean(driverProfile.documentUrls?.[0]) },
            { label: "Vehicle Registration", key: "vehicleRC", submitted: Boolean(driverProfile.documentUrls?.[1]) },
            { label: "Profile Photo", key: "profilePhoto", submitted: Boolean(driverProfile.documentUrls?.[2]) },
        ];

        return res.status(200).json({
            success: true,
            driver: {
                name: user.name,
                phone: user.phone,
                email: user.email,
                driverId: user._id,
                registeredOn: user.createdAt,
                role: "Delivery Partner",
                approvalStatus: user.status, // "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "REJECTED"
                availabilityStatus: driverProfile.availabilityStatus, // "ONLINE" | "OFFLINE" | "BUSY"
                vehicleType: driverProfile.vehicleType,
                vehicleNumber: driverProfile.vehicleNumber,
                licenseNumber: driverProfile.licenseNumber,
                documents,
            },
        });

    } catch (err) {
        console.error("[getMyDriverProfile]", err);
        return res.status(500).json({ success: false, message: "Server error while fetching driver profile." });
    }
};

module.exports = { getMyDriverProfile };