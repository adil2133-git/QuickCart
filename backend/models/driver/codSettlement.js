const mongoose = require("mongoose");

// One document per settlement attempt. Covers all three flows from the spec:
//   - WALLET only      -> onlineAmountDue = 0, status starts COMPLETED
//   - WALLET + ONLINE  -> onlineAmountDue > 0, status PENDING_PAYMENT until verified
//   - ONLINE only      -> walletAmountUsed = 0, status PENDING_PAYMENT until verified
const codSettlementSchema = new mongoose.Schema(
    {
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverProfile",
            required: true,
        },

        // orders being settled by this attempt (snapshot at creation time)
        orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

        totalAmount: { type: Number, required: true }, // walletAmountUsed + onlineAmountDue
        walletAmountUsed: { type: Number, default: 0 },
        onlineAmountDue: { type: Number, default: 0 },

        status: {
            type: String,
            enum: ["PENDING_PAYMENT", "COMPLETED", "FAILED"],
            default: "PENDING_PAYMENT",
        },

        razorpayOrderId: { type: String, default: null },
        razorpayPaymentId: { type: String, default: null },
        razorpaySignature: { type: String, default: null },

        completedAt: { type: Date, default: null },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

codSettlementSchema.index({ driverId: 1, status: 1 });

module.exports = mongoose.model("CodSettlement", codSettlementSchema);