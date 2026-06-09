const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        complaintType: {
            type: String,
            enum: ["ORDER", "DRIVER", "STORE", "PAYMENT", "OTHER"],
            required: true,
        },
        description: { type: String, required: true },
        status: {
            type: String,
            enum: ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"],
            default: "OPEN",
        },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("Complaint", complaintSchema);
