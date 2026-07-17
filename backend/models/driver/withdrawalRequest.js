const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DriverProfile",
        required: true,
    },
    amount: { type: Number, required: true, min: 1 },

    // PENDING -> APPROVED -> PAID, or PENDING -> REJECTED.
    // availableBalance is only debited once status reaches PAID.
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
        default: "PENDING",
    },

    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    paidAt: { type: Date, default: null },

    requestedAt: { type: Date, default: Date.now },
});

withdrawalRequestSchema.index({ driverId: 1, requestedAt: -1 });

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);