const mongoose = require("mongoose");

const settlementRecordSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
        },
        storeAmount: { type: Number, required: true },
        driverAmount: { type: Number, required: true },
        platformAmount: { type: Number, required: true },
        paymentMethod: {
            type: String,
            enum: ["ONLINE", "COD"],
            required: true,
        },
        settlementStatus: {
            type: String,
            enum: ["PENDING", "SETTLED", "FAILED"],
            default: "PENDING",
        },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("SettlementRecord", settlementRecordSchema);
