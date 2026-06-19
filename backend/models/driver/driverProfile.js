const mongoose = require("mongoose")

const driverProfileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        vehicleType: { type: String, required: true },
        vehicleNumber: { type: String, required: true },
        licenseNumber: { type: String, required: true },
        documentUrls: [{ type: String }],
        walletBalance: { type: Number, default: 0 },
        cashCollected: { type: Number, default: 0 },
        cashPendingSettlement: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        totalDeliveries: { type: Number, default: 0 },
        currentLevel: { type: String, default: "BRONZE" },
        availabilityStatus: { type: String, enum: ["ONLINE", "OFFLINE", "BUSY"], default: "OFFLINE" },

        // NEW — for admin review
        reviewNotes: [
            {
                note: { type: String, required: true },
                author: { type: String, required: true },
                date: { type: Date, default: Date.now },
            },
        ],
        rejectionReason: { type: String, default: null },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("DriverProfile", driverProfileSchema);