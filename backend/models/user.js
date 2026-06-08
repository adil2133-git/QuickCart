const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, unique: true },
        email: { type: String, unique: true, sparse: true, lowercase: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["CUSTOMER", "DRIVER", "STORE", "ADMIN"],
            required: true,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED", "REJECTED"],
            default: "ACTIVE",
        },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("User", userSchema);
