const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ["ORDER", "DELIVERY", "PAYMENT", "PROMO", "SYSTEM"],
            default: "SYSTEM",
        },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

// Index for fetching user-specific notifications quickly
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
