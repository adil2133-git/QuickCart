const mongoose = require("mongoose");
const Category = require("../../models/store/category");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Create Category  (POST /api/store/addCategory) ──────────────────────────

const createCategory = async (req, res) => {
    try {
        const { categoryName, status } = req.body;

        if (!categoryName || !categoryName.trim()) {
            return res.status(400).json({ message: "categoryName is required." });
        }

        // req.file is set by uploadCategoryImage (multer-storage-cloudinary).
        // req.file.path is the Cloudinary secure_url.
        const image = req.file ? req.file.path : req.body.image;

        const category = await Category.create({
            categoryName: categoryName.trim(),
            image,
            status: status || "ACTIVE",
        });

        return res.status(201).json({ message: "Category created successfully.", category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "A category with this name already exists." });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};



const getCategories = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {};
        if (status) {
            const validStatuses = ["ACTIVE", "INACTIVE"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
            }
            filter.status = status;
        }

        const categories = await Category.find(filter).sort({ categoryName: 1 });

        return res.status(200).json({ categories });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Get Single Category  (GET /api/store/getSingleCategory?categoryId=...) ─

const getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.query;

        if (!isValidObjectId(categoryId)) {
            return res.status(400).json({ message: "Invalid categoryId." });
        }

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        return res.status(200).json({ category });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Update Category  (PUT /api/store/updateCategory?categoryId=...) ────────

const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.query;

        if (!isValidObjectId(categoryId)) {
            return res.status(400).json({ message: "Invalid categoryId." });
        }

        const allowedFields = ["categoryName", "status"];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
        );

        if (updates.categoryName) {
            updates.categoryName = updates.categoryName.trim();
        }

        if (req.file) {
            updates.image = req.file.path;
        }

        const category = await Category.findByIdAndUpdate(
            categoryId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        return res.status(200).json({ message: "Category updated successfully.", category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "A category with this name already exists." });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Delete Category  (DELETE /api/store/deleteCategory?categoryId=...) ─────
// Note: does NOT check if products reference this category first.

const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.query;

        if (!isValidObjectId(categoryId)) {
            return res.status(400).json({ message: "Invalid categoryId." });
        }

        const category = await Category.findByIdAndDelete(categoryId);

        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        return res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};