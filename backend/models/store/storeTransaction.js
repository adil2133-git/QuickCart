const mongoose = require("mongoose");

const storeTransactionSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreProfile",
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        amount: { type: Number, required: true },
        type: {
            type: String,
            enum: ["SALE", "WITHDRAWAL", "REFUND"],
            required: true,
        },
        description: { type: String },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("StoreTransaction", storeTransactionSchema);
