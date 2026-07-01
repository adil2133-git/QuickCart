const DriverProfile = require("../../models/driver/driverProfile");

// ─── PATCH /api/driver/location ───────────────────────────────────────────────
// Called by the driver app every ~15 seconds while ONLINE.
// Only accepts pings from ONLINE drivers — OFFLINE/BUSY pings are silently
// ignored (BUSY drivers still have location from when they went BUSY).
const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (typeof lat !== "number" || typeof lng !== "number") {
            return res.status(400).json({ success: false, message: "lat and lng are required numbers." });
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ success: false, message: "Invalid coordinates." });
        }

        const driver = await DriverProfile.findOne({ userId: req.user.userID });
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver profile not found." });
        }

        // Only track location while actually online — ignore stale pings
        // that arrive after the driver went offline/busy
        if (driver.availabilityStatus !== "ONLINE") {
            return res.status(200).json({ success: true, ignored: true });
        }

        driver.currentLocation = { lat, lng };
        driver.lastLocationUpdate = new Date();
        await driver.save();

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateLocation]", err);
        return res.status(500).json({ success: false, message: "Failed to update location." });
    }
};

module.exports = { updateLocation };