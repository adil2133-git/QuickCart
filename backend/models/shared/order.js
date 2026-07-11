const mongoose = require("mongoose");

const orderProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, required: true, unique: true },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomerProfile",
            required: true,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreProfile",
            required: true,
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverProfile",
            default: null,
        },
        products: [orderProductSchema],
        subtotal: { type: Number, required: true },
        deliveryCharge: { type: Number, required: true, default: 0 },
        handlingFee: { type: Number, required: true, default: 0 },
        totalAmount: { type: Number, required: true },
        paymentMethod: {
            type: String,
            enum: ["ONLINE", "COD"],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
            default: "PENDING",
        },
        // How much of totalAmount (if any) was paid from the customer's
        // QuickKart wallet. For ONLINE orders, Razorpay only ever collects
        // (totalAmount - walletAmountUsed) — this field is what makes that
        // split auditable after the fact.
        walletAmountUsed: { type: Number, default: 0 },
        razorpayOrderId: { type: String, default: null },
        razorpayPaymentId: { type: String, default: null },
        razorpaySignature: { type: String, default: null },
        deliveryAddress: { type: String, required: true },
        // Captured from the customer's savedAddress at checkout time so
        // delivery-leg distance can be calculated for drivers. Optional
        // because older orders/addresses may not have coordinates set.
        deliveryCoordinates: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },
        recipientName: { type: String, required: true },
        recipientPhone: { type: String, required: true },
        orderStatus: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "PACKING",
                "READY_FOR_PICKUP",
                "DRIVER_ASSIGNED",
                "PICKED_UP",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
            ],
            default: "PENDING",
        },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);


orderSchema.path("orderNumber").default(function () {
    return "QK" + Date.now();
});

module.exports = mongoose.model("Order", orderSchema);