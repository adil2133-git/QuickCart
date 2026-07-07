const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title:   { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ["ORDER", "DELIVERY", "SYSTEM"],
            default: "ORDER",
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },
        isRead: { type: Boolean, default: false },
        // Used by the weekly cron cleanup job
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);