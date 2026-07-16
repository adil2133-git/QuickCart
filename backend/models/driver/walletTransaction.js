const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
    {
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverProfile",
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },
        amount: { type: Number, required: true }, // always positive; `type` gives direction
        type: {
            type: String,
            enum: [
                "EARNING",    // per-delivery payout, credited when an order is marked DELIVERED
                "BONUS",      // incentive credit (weekly target, admin adjustment, etc.)
                "WITHDRAWAL", // payout to the driver's bank account, debits the wallet
                "ADJUSTMENT", // manual correction by admin
            ],
            required: true,
        },
        description: { type: String },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
