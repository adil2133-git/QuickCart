const mongoose = require("mongoose");

const driverDeliveryRequestSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverProfile",
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "EXPIRED", "REJECTED"],
            default: "PENDING",
        },
        // Snapshot at broadcast time so a page refresh and the socket push
        // always agree on the numbers, even if the driver has since moved.
        pickupDistanceKm: { type: Number, default: 0 },
        deliveryDistanceKm: { type: Number, default: 0 },
        estimatedEarnings: { type: Number, default: 0 },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("DriverDeliveryRequest", driverDeliveryRequestSchema);