const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StoreProfile",
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        productName: { type: String, required: true, trim: true },
        description: { type: String },
        price: { type: Number, required: true, min: 0 },
        stockQuantity: { type: Number, required: true, default: 0, min: 0 },
        unit: { type: String, required: true },
        images: [{ type: String }],
        availabilityStatus: {
            type: String,
            enum: ["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"],
            default: "AVAILABLE",
        },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

productSchema.index({ storeId: 1, categoryId: 1 });
productSchema.index({ productName: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
