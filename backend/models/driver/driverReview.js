const mongoose = require("mongoose");

const driverReviewSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomerProfile",
            required: true,
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverProfile",
            required: true,
        },
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String, trim: true },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("DriverReview", driverReviewSchema);
