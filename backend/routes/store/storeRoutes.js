const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoute");
const { uploadProductImages } = require("../../middleware/uploadProductImages");
const { uploadCategoryImage } = require("../../middleware/uploadCategoryImages");

const {
    getMyStoreProfile,
    updateStoreBranding,
    toggleManualClose,
    updateStoreInfo,
    updateOperatingHours,
} = require("../../controllers/store/storeProfileController");
const { uploadStoreBranding } = require("../../middleware/uploadStoreBranding");

const {
    createProduct,
    getProductById,
    getProductsByStore,
    updateProduct,
    toggleAvailability,
    updateStock,
    deleteProduct,
} = require("../../controllers/store/productController");
const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require("../../controllers/store/categoryController");

// GET /api/store/me
router.get("/me", protectRoutes, getMyStoreProfile);
router.patch("/branding", protectRoutes, uploadStoreBranding, updateStoreBranding);
router.patch("/toggleManualClose", protectRoutes, toggleManualClose);
router.patch("/info", protectRoutes, updateStoreInfo);
router.patch("/hours", protectRoutes, updateOperatingHours);

// ─── Products ─────────────────────────────────────────────────────────────────
router.post("/addProduct", protectRoutes, uploadProductImages, createProduct);
router.get("/getProductsByStore", protectRoutes, getProductsByStore);
router.get("/getSingleProduct/:id", protectRoutes, getProductById);
router.put("/updateProduct/:id", protectRoutes, uploadProductImages, updateProduct);
router.patch("/toggleAvailability/:id", protectRoutes, toggleAvailability);
router.patch("/updateStock/:id", protectRoutes, updateStock);
router.delete("/deleteProduct/:id", protectRoutes, deleteProduct);

// ─── Categories ───────────────────────────────────────────────────────────────
// Global (not store-scoped) — getCategories has no protectRoutes so any logged-in
// area of the app could read it too; add protectRoutes here if that's not desired.
router.post("/addCategory", protectRoutes, uploadCategoryImage, createCategory);
router.get("/getCategories", getCategories);
router.get("/getSingleCategory/:id", protectRoutes, getCategoryById);
router.put("/updateCategory/:id", protectRoutes, uploadCategoryImage, updateCategory);
router.delete("/deleteCategory/:id", protectRoutes, deleteCategory);

module.exports = router;