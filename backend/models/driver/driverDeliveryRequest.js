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
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model(
    "DriverDeliveryRequest",
    driverDeliveryRequestSchema
);
