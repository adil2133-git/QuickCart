const mongoose = require("mongoose");

const operatingHoursSchema = new mongoose.Schema({
    day:       { type: String },
    openTime:  { type: String },
    closeTime: { type: String },
    isClosed:  { type: Boolean, default: false },
});

const reviewNoteSchema = new mongoose.Schema({
    note:   { type: String, required: true },
    author: { type: String, required: true },
    date:   { type: Date, default: Date.now },
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

        // Public-facing branding images, set by the store owner from their
        // dashboard. Distinct from documentUrls, which are approval documents
        // and are never shown to customers.
        logoUrl:       { type: String, default: null },
        coverImageUrl: { type: String, default: null },

        coordinates: {
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },

        operatingHours: [operatingHoursSchema],

        // storeStatus now only carries the "BUSY" manual signal and the
        // pre-approval default. OPEN/CLOSED for an approved store is derived
        // at read time from operatingHours + isManuallyClosed (see
        // helpers/storeStatus.js) rather than trusted directly off this field,
        // since trusting a stale stored value would show "OPEN" overnight.
        storeStatus: {
            type:    String,
            enum:    ["OPEN", "CLOSED", "BUSY"],
            default: "CLOSED",
        },

        // Store-controlled override, e.g. "closing early today" or "on a break".
        // When true, the store reads as CLOSED regardless of operatingHours.
        isManuallyClosed: { type: Boolean, default: false },

        availableBalance: { type: Number, default: 0 },
        pendingBalance:   { type: Number, default: 0 },
        averageRating:    { type: Number, default: 0, min: 0, max: 5 },
        totalOrders:      { type: Number, default: 0 },

        // ---- Approval workflow fields (mirrors DriverProfile) ----
        rejectionReason: { type: String, default: null },
        reviewNotes:      { type: [reviewNoteSchema], default: [] },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

storeProfileSchema.index({ coordinates: "2dsphere" });

module.exports = mongoose.model("StoreProfile", storeProfileSchema);