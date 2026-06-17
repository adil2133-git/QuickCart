const mongoose = require("mongoose");

const operatingHoursSchema = new mongoose.Schema({
    day:       { type: String },
    openTime:  { type: String },
    closeTime: { type: String },
    isClosed:  { type: Boolean, default: false },
});

const storeProfileSchema = new mongoose.Schema(
    {
        userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        storeName: { type: String, required: true, trim: true },
        ownerName: { type: String, required: true },
        address:   { type: String, required: true },
        pincode:   { type: String, default: null },

        // Order: [tradeLicense, ownerId, storeFront]
        documentUrls: { type: [String], default: [] },

        coordinates: {
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },

        operatingHours: [operatingHoursSchema],
        storeStatus: {
            type:    String,
            enum:    ["OPEN", "CLOSED", "BUSY"],
            default: "CLOSED",
        },
        availableBalance: { type: Number, default: 0 },
        pendingBalance:   { type: Number, default: 0 },
        averageRating:    { type: Number, default: 0, min: 0, max: 5 },
        totalOrders:      { type: Number, default: 0 },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

storeProfileSchema.index({ coordinates: "2dsphere" });

module.exports = mongoose.model("StoreProfile", storeProfileSchema);