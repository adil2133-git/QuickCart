const mongoose = require("mongoose");

const savedAddressSchema = new mongoose.Schema({
    label: { type: String },
    address: { type: String, required: true },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number },
    },
});

const customerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        savedAddresses: [savedAddressSchema],
        defaultAddress: { type: mongoose.Schema.Types.ObjectId },
        totalOrders: { type: Number, default: 0 },
        codAllowed: { type: Boolean, default: true },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);