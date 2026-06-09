const mongoose = require("mongoose");

const orderStatusHistorySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    status: { type: String, required: true },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OrderStatusHistory", orderStatusHistorySchema);
