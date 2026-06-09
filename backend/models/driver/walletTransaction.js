const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
    {
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverProfile",
            required: true,
        },
        amount: { type: Number, required: true },
        type: {
            type: String,
            enum: ["COMMISSION", "BONUS", "WITHDRAWAL"],
            required: true,
        },
        description: { type: String },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
