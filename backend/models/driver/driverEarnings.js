const mongoose = require("mongoose");

const driverEarningsSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DriverProfile",
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    commission: { type: Number, required: true, default: 0 },
    bonus: { type: Number, default: 0 },
    totalEarned: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DriverEarnings", driverEarningsSchema);
