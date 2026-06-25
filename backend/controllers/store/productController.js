const Product = require("../../models/store/product");
const StoreProfile = require("../../models/store/storeProfile");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Resolves the logged-in STORE user's StoreProfile._id from the JWT.
// storeId is never trusted from the client — same principle as getMyStoreProfile.
const resolveStoreId = async (req) => {
    const userId = req.user.userID;
    const storeProfile = await StoreProfile.findOne({ userId });
    return storeProfile ? storeProfile._id : null;
};

// ─── Create Product  (POST /api/store/addProduct) ────────────────────────────

const createProduct = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ message: "Store profile not found for this account." });
        }

        const {
            categoryId,
            productName,
            description,
            price,
            stockQuantity,
            unit,
            availabilityStatus,
            isBestseller,
        } = req.body;

        if (!isValidObjectId(categoryId)) {
            return res.status(400).json({ message: "Invalid categoryId." });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one product image is required."
            });
        }

        const uploadedImageUrls = req.files.map((file) => file.path);

        const product = await Product.create({
            storeId,
            categoryId,
            productName,
            description,
            price,
            stockQuantity,
            unit,
            images: uploadedImageUrls,
            availabilityStatus: availabilityStatus || "AVAILABLE",
            isBestseller: Boolean(isBestseller),
        });

        return res.status(201).json({
            message: "Product created successfully.",
            product
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({
            message: "Server error.",
            error: error.message
        });
    }
};

// ─── Get All Products for the logged-in store  (GET /api/store/getProductsByStore) ───

const getProductsByStore = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ message: "Store profile not found for this account." });
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
            filter.productName = { $regex: search, $options: "i" };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("categoryId", "categoryName image status")
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

// ─── Get Single Product  (GET /api/store/getSingleProduct/:id) ──────────────
// Still scoped to the logged-in store — a store can't fetch another store's product by guessing an ID.

const getProductById = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ message: "Store profile not found for this account." });
        }

        const { id: productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const product = await Product.findOne({ _id: productId, storeId }).populate(
            "categoryId",
            "categoryName image status"
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        return res.status(200).json({ product });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Update Product  (PUT /api/store/updateProduct/:id) ─────────────────────

const updateProduct = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ message: "Store profile not found for this account." });
        }

        const { id: productId } = req.params;

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
            "availabilityStatus",
            "isBestseller",
        ];

        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
        );

        if (updates.categoryId && !isValidObjectId(updates.categoryId)) {
            return res.status(400).json({ message: "Invalid categoryId." });
        }

        const newlyUploadedUrls = (req.files || []).map((file) => file.path);

        if (req.body.existingImages !== undefined || newlyUploadedUrls.length > 0) {
            let keptImages = [];
            if (req.body.existingImages) {
                try {
                    keptImages = JSON.parse(req.body.existingImages);
                } catch {
                    return res.status(400).json({ message: "existingImages must be a JSON array of URLs." });
                }
            }
            updates.images = [...keptImages, ...newlyUploadedUrls];
        }

        const product = await Product.findOneAndUpdate(
            { _id: productId, storeId },
            { $set: updates },
            { returnDocument: "after", runValidators: true }
        ).populate("categoryId", "categoryName image status");

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

// ─── Toggle Availability  (PATCH /api/store/toggleAvailability/:id) ─────────

const toggleAvailability = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ message: "Store profile not found for this account." });
        }

        const { id: productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const product = await Product.findOne({ _id: productId, storeId });

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

// ─── Toggle Bestseller  (PATCH /api/store/toggleBestseller/:id) ─────────────
// Manual flag for now. Will likely be replaced/supplemented by an
// auto-derived "top seller" calculation once the order module exists.

const toggleBestseller = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ message: "Store profile not found for this account." });
        }

        const { id: productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const product = await Product.findOne({ _id: productId, storeId });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        product.isBestseller = !product.isBestseller;
        await product.save();

        return res.status(200).json({
            message: product.isBestseller ? "Marked as bestseller." : "Removed from bestsellers.",
            isBestseller: product.isBestseller,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Update Stock Count  (PATCH /api/store/updateStock/:id) ─────────────────

const updateStock = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ message: "Store profile not found for this account." });
        }

        const { id: productId } = req.params;
        const { stockQuantity } = req.body;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        if (typeof stockQuantity !== "number" || stockQuantity < 0) {
            return res.status(400).json({ message: "stockQuantity must be a non-negative number." });
        }

        const product = await Product.findOneAndUpdate(
            { _id: productId, storeId },
            {
                $set: {
                    stockQuantity,
                    availabilityStatus: stockQuantity === 0 ? "OUT_OF_STOCK" : "AVAILABLE",
                },
            },
            { returnDocument: "after", runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        return res.status(200).json({ message: "Stock updated.", product });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Delete Product  (DELETE /api/store/deleteProduct/:id) ──────────────────

const deleteProduct = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ message: "Store profile not found for this account." });
        }

        const { id: productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const product = await Product.findOneAndDelete({ _id: productId, storeId });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        return res.status(200).json({ message: "Product deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ════════════════════════════════════════════════════════════════════════════
//  Public / customer-facing endpoints — no store JWT, storeId from the URL
// ════════════════════════════════════════════════════════════════════════════

// ─── Public Product Catalogue  (GET /api/stores/:storeId/products) ─────────
// Same filter/sort/paginate shape as getProductsByStore, but storeId comes
// from the route param since the caller is a customer, not the store owner.
// Always excludes HIDDEN products — a customer should never see those
// regardless of what status filter they pass.

const getPublicStoreProducts = async (req, res) => {
    try {
        const { storeId } = req.params;

        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ message: "Invalid storeId." });
        }

        const { categoryId, search, page = 1, limit = 20, sort } = req.query;

        const filter = { storeId, availabilityStatus: { $ne: "HIDDEN" } };

        if (categoryId) {
            if (!isValidObjectId(categoryId)) {
                return res.status(400).json({ message: "Invalid categoryId." });
            }
            filter.categoryId = categoryId;
        }

        if (search) {
            filter.productName = { $regex: search, $options: "i" };
        }

        const sortMap = {
            priceAsc: { price: 1 },
            priceDesc: { price: -1 },
            newest: { createdAt: -1 },
        };
        const sortBy = sortMap[sort] || sortMap.newest;

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("categoryId", "categoryName image status")
                .sort(sortBy)
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

// ─── Public Bestsellers  (GET /api/stores/:storeId/bestsellers) ────────────

const getStoreBestsellers = async (req, res) => {
    try {
        const { storeId } = req.params;

        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ message: "Invalid storeId." });
        }

        const { limit = 6 } = req.query;

        const products = await Product.find({
            storeId,
            isBestseller: true,
            availabilityStatus: { $ne: "HIDDEN" },
        })
            .populate("categoryId", "categoryName image status")
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        return res.status(200).json({ products });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Public Product Detail  (GET /api/customer/:storeId/products/:productId) ───
const getPublicProductDetail = async (req, res) => {
    try {
        const { storeId, productId } = req.params;

        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ message: "Invalid storeId." });
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId." });
        }

        const product = await Product.findOne({
            _id: productId,
            storeId,
            availabilityStatus: { $ne: "HIDDEN" },
        })
            .populate("categoryId", "categoryName image status")
            .populate("storeId", "storeName averageRating");

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        return res.status(200).json({ product });
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
    toggleBestseller,
    updateStock,
    deleteProduct,
    getPublicStoreProducts,
    getStoreBestsellers,
    getPublicProductDetail,
};