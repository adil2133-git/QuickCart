const mongoose = require("mongoose");

/**
 * NOTE: This file is reconstructed from how `productController.js` uses the
 * Product model (storeId, categoryId, productName, description, price,
 * stockQuantity, unit, images, availabilityStatus, createdAt) plus the new
 * isBestseller field needed for the store page.
 *
 * You already have a real Product model in your project — please diff this
 * against it rather than overwriting blindly, since fields like validation
 * rules, indexes, or text-search config (your controller uses
 * `filter.$text = { $search: search }`, which means a text index already
 * exists on productName/description somewhere) may differ from this
 * reconstruction.
 */

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
        description: { type: String, trim: true },
        price: { type: Number, required: true, min: 0 },
        stockQuantity: { type: Number, required: true, min: 0, default: 0 },
        unit: { type: String, required: true },
        images: { type: [String], default: [] },
        availabilityStatus: {
            type: String,
            enum: ["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"],
            default: "AVAILABLE",
        },

        // Manual flag set by the store owner. Will likely be replaced or
        // supplemented later by an auto-derived "top seller" signal once the
        // order/customer module exists and sales counts are available.
        isBestseller: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

productSchema.index({ productName: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);