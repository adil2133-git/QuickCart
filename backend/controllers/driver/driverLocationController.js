const DriverProfile = require("../../models/driver/driverProfile");
const Order = require("../../models/shared/order");
const { emitToCustomer } = require("../../socket");

// Statuses during which the driver already has an assigned order and the
// customer may be watching a live map — location updates are only worth
// broadcasting during this window.
const TRACKABLE_STATUSES = ["DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"];

// ─── PATCH /api/driver/location ───────────────────────────────────────────────
// Called by the driver app every ~15 seconds while ONLINE. OFFLINE/BUSY pings
// are silently ignored (BUSY drivers keep the location from when they went BUSY).
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

        // Ignore stale pings that arrive after the driver went offline/busy
        if (driver.availabilityStatus !== "ONLINE") {
            return res.status(200).json({ success: true, ignored: true });
        }

        driver.currentLocation = { lat, lng };
        driver.lastLocationUpdate = new Date();
        await driver.save();

        // Fire-and-forget: if this driver currently has an order out for
        // delivery, push the new position straight to that customer.
        Order.findOne({ driverId: driver._id, orderStatus: { $in: TRACKABLE_STATUSES } })
            .select("_id customerId orderStatus")
            .lean()
            .then((order) => {
                if (!order) return;
                emitToCustomer(order.customerId, "driver:location", {
                    orderId: order._id.toString(),
                    lat,
                    lng,
                });
            })
            .catch(() => {});

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[updateLocation]", err);
        return res.status(500).json({ success: false, message: "Failed to update location." });
    }
};

module.exports = { updateLocation };