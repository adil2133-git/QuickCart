const Product = require("../models/Product");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


const createProduct = async (req, res) => {
    try {
        const {
            storeId,
            categoryId,
            productName,
            description,
            price,
            stockQuantity,
            unit, 
            images,
            availabilityStatus,
        } = req.body;

        if (!isValidObjectId(storeId) || !isValidObjectId(categoryId)) {
            return res.status(400).json({ message: "Invalid storeId or categoryId." });
        }

        const product = await Product.create({
            storeId,
            categoryId,
            productName,
            description,
            price,
            stockQuantity,
            unit,
            images: images || [],
            availabilityStatus: availabilityStatus || "AVAILABLE",
        });

        return res.status(201).json({ message: "Product created successfully.", product });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Get All Products for a Store  (Inventory / Products list) ───────────────

const getProductsByStore = async (req, res) => {
    try {
        const { storeId } = req.params;

        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ message: "Invalid storeId." });
        }

        const { categoryId, status, search, page = 1, limit = 20 } = req.query;

        const filter = { storeId };

        if (categoryId) {
            if (!isValidObjectId(categoryId)) {
                return res.status(400).json({ message: "Invalid categoryId." });
            }
            filter.categoryId = categoryId;
        }

        if (status) {
            const validStatuses = ["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
            }
            filter.availabilityStatus = status;
        }

        if (search) {
            filter.$text = { $search: search };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("categoryId", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Product.countDocuments(filter),
        ]);

        return res.status(200).json({
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            products,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Get Single Product  (Edit Product — pre-fill form) ──────────────────────

const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const product = await Product.findById(productId).populate("categoryId", "name");

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        return res.status(200).json({ product });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Update Product  (Save Product — Figma "Save Product" button) ────────────

const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const allowedFields = [
            "categoryId",
            "productName",
            "description",
            "price",
            "stockQuantity",
            "unit",
            "images",
            "availabilityStatus",
        ];

        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
        );

        if (updates.categoryId && !isValidObjectId(updates.categoryId)) {
            return res.status(400).json({ message: "Invalid categoryId." });
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate("categoryId", "name");

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        return res.status(200).json({ message: "Product updated successfully.", product });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Toggle Availability  (Figma "Available for sale" toggle) ────────────────

const toggleAvailability = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        product.availabilityStatus =
            product.availabilityStatus === "AVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE";

        await product.save();

        return res.status(200).json({
            message: `Product is now ${product.availabilityStatus}.`,
            availabilityStatus: product.availabilityStatus,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Update Stock Count  (Inventory quick-edit) ──────────────────────────────

const updateStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { stockQuantity } = req.body;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        if (typeof stockQuantity !== "number" || stockQuantity < 0) {
            return res.status(400).json({ message: "stockQuantity must be a non-negative number." });
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            {
                $set: {
                    stockQuantity,
                    availabilityStatus: stockQuantity === 0 ? "OUT_OF_STOCK" : "AVAILABLE",
                },
            },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        return res.status(200).json({ message: "Stock updated.", product });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Delete Product ───────────────────────────────────────────────────────────

const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const product = await Product.findByIdAndDelete(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        return res.status(200).json({ message: "Product deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = {
    createProduct,
    getProductsByStore,
    getProductById,
    updateProduct,
    toggleAvailability,
    updateStock,
    deleteProduct,
};