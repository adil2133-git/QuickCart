const mongoose = require("mongoose")

const driverProfileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        vehicleType: { type: String, required: true },
        vehicleNumber: { type: String, required: true },
        licenseNumber: { type: String, required: true },
        documentUrls: [{ type: String }],

        // Earnings land here first (see driverWalletService.creditEarning) and
        // move to availableBalance only after the T+1 settlement cron runs.
        // Never withdrawable directly.
        pendingBalance: { type: Number, default: 0 },

        // Withdrawable balance. Only ever increased by the settlement cron
        // (pending -> available) or by BONUS/ADJUSTMENT/REFUND transactions,
        // and only ever decreased by withdrawals or COD wallet-offset.
        availableBalance: { type: Number, default: 0 },

        cashCollected: { type: Number, default: 0 },
        cashPendingSettlement: { type: Number, default: 0 },

        // Timestamp of the oldest currently-unsettled COD collection. Set the
        // moment cashPendingSettlement goes from 0 -> >0, cleared back to null
        // once it returns to 0. Drives the SUSPENDED restriction tier.
        cashPendingSince: { type: Date, default: null },

        // Progressive COD-pending restriction tier — recomputed by
        // driverWalletService.refreshCodRestriction() after every collection
        // and settlement, and swept periodically by jobs/codRestrictionSweep.js
        // for the time-based SUSPENDED transition.
        codRestrictionStatus: {
            type: String,
            enum: ["NORMAL", "WARNING", "RESTRICTED", "SUSPENDED"],
            default: "NORMAL",
        },

        // throttles jobs/codRestrictionSweep.js's periodic reminder so it
        // doesn't re-notify every sweep pass
        lastCodReminderAt: { type: Date, default: null },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        totalDeliveries: { type: Number, default: 0 },
        currentLevel: { type: String, default: "BRONZE" },
        availabilityStatus: { type: String, enum: ["ONLINE", "OFFLINE", "BUSY"], default: "OFFLINE" },

        // live location, updated by the driver app while ONLINE — { lat, lng }
        // matches StoreProfile's coordinate format. lastLocationUpdate is what
        // lets the offline sweep detect stale/disconnected drivers.
        currentLocation: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },
        lastLocationUpdate: { type: Date, default: null },

        // admin review trail for driver applications
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