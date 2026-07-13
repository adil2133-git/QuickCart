const mongoose = require("mongoose");

const customerWalletTransactionSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomerProfile",
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
                "REFUND_CREDIT",   // cancellation refund credited to wallet
                "ORDER_PAYMENT",   // wallet balance spent at checkout
                "ADMIN_ADJUSTMENT", // manual correction by admin
                "CANCELLATION_FEE", // COD order cancelled after packing started -- store compensation deducted from wallet
            ],
            required: true,
        },
        description: { type: String },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("CustomerWalletTransaction", customerWalletTransactionSchema);