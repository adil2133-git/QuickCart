const DriverProfile = require("../../models/driver/driverProfile");
const Order = require("../../models/shared/order");
const { emitToCustomer } = require("../../socket");

// statuses where a customer might be watching the live map
const TRACKABLE_STATUSES = ["DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"];

// PATCH /api/driver/location — driver app pings this every ~15s while ONLINE
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

        // ignore pings that slip in after the driver went offline/busy
        if (driver.availabilityStatus !== "ONLINE") {
            return res.status(200).json({ success: true, ignored: true });
        }

        driver.currentLocation = { lat, lng };
        driver.lastLocationUpdate = new Date();
        await driver.save();

        // if this driver has an active delivery, push the position to that customer
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