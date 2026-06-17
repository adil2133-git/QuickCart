const User = require("../../models/shared/user");
const DriverProfile = require("../../models/driver/driverProfile");

// GET /api/driver/me
// Requires protectRoutes middleware (req.user.userID is set from the JWT)
const getMyDriverProfile = async (req, res) => {
    try {
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

        // Map raw documentUrls into labeled document objects the frontend can render.
        // documentUrls is stored in the order: [drivingLicense, vehicleRC, profilePhoto] (only the ones that were provided)
        // We don't currently track per-document review status, so "submitted" just means a URL exists.
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