const mongoose = require("mongoose");

const operatingHoursSchema = new mongoose.Schema({
  day: { type: String }, 
  openTime: { type: String }, 
  closeTime: { type: String }, 
  isClosed: { type: Boolean, default: false },
});

const storeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    storeName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    operatingHours: [operatingHoursSchema],
    storeStatus: {
      type: String,
      enum: ["OPEN", "CLOSED", "BUSY"],
      default: "CLOSED",
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);


storeProfileSchema.index({ coordinates: "2dsphere" });

module.exports = mongoose.model("StoreProfile", storeProfileSchema);
