const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DriverProfile",
        required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
    },
    requestedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
