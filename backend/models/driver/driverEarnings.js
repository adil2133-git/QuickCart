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

    // PENDING on creation (credited to pendingBalance). Flips to AVAILABLE
    // once the T+1 settlement cron moves the amount into availableBalance.
    status: {
        type: String,
        enum: ["PENDING", "AVAILABLE"],
        default: "PENDING",
    },

    // createdAt + 24h — the settlement cron picks up rows where this has
    // passed and status is still PENDING.
    availableAt: { type: Date, required: true },

    settledAt: { type: Date, default: null },

    date: { type: Date, default: Date.now },
});

driverEarningsSchema.index({ status: 1, availableAt: 1 });

module.exports = mongoose.model("DriverEarnings", driverEarningsSchema);