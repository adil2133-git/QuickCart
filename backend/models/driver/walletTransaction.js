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
                "EARNING",        // per-delivery payout, credited to pendingBalance when an order is marked DELIVERED
                "BONUS",          // incentive credit (weekly target, admin adjustment, etc.) — credited straight to availableBalance
                "WITHDRAWAL",     // payout to the driver's bank account, debits availableBalance
                "COD_SETTLEMENT", // wallet portion used to offset cashPendingSettlement, debits availableBalance
                "REFUND",         // reversal credited back to availableBalance
                "ADJUSTMENT",     // manual correction by admin
                "PENALTY",        // manual deduction by admin, debits availableBalance
            ],
            required: true,
        },

        // COMPLETED for everything except EARNING, which starts PENDING and
        // is flipped to AVAILABLE by the settlement cron once the amount
        // actually lands in availableBalance.
        status: {
            type: String,
            enum: ["PENDING", "AVAILABLE", "COMPLETED"],
            default: "COMPLETED",
        },

        description: { type: String },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

walletTransactionSchema.index({ driverId: 1, createdAt: -1 });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);