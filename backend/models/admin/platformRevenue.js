const mongoose = require("mongoose");

const platformRevenueSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
        },
        storeCommission: { type: Number, required: true, default: 0 },
        deliveryCommission: { type: Number, required: true, default: 0 },
        totalRevenue: { type: Number, required: true },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("PlatformRevenue", platformRevenueSchema);