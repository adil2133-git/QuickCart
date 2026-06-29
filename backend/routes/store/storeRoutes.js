const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoute");
const authorizeRoles = require("../../middleware/authorizeRoles");

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

const {
    getStoreOrders,
    getStoreOrderDetail,
    updateOrderStatus,
} = require("../../controllers/store/storeOrdersController");

// GET /api/store/me
router.get("/me", protectRoutes, authorizeRoles("STORE"), getMyStoreProfile);
router.patch("/branding", protectRoutes, authorizeRoles("STORE"), uploadStoreBranding, updateStoreBranding);
router.patch("/toggleManualClose", protectRoutes, authorizeRoles("STORE"), toggleManualClose);
router.patch("/info", protectRoutes, authorizeRoles("STORE"), updateStoreInfo);
router.patch("/hours", protectRoutes, authorizeRoles("STORE"), updateOperatingHours);

// ─── Products ─────────────────────────────────────────────────────────────────
router.post("/addProduct", protectRoutes, authorizeRoles("STORE"), uploadProductImages, createProduct);
router.get("/getProductsByStore", protectRoutes, authorizeRoles("STORE"), getProductsByStore);
router.get("/getSingleProduct/:id", protectRoutes, authorizeRoles("STORE"), getProductById);
router.put("/updateProduct/:id", protectRoutes, authorizeRoles("STORE"), uploadProductImages, updateProduct);
router.patch("/toggleAvailability/:id", protectRoutes, authorizeRoles("STORE"), toggleAvailability);
router.patch("/updateStock/:id", protectRoutes, authorizeRoles("STORE"), updateStock);
router.delete("/deleteProduct/:id", protectRoutes, authorizeRoles("STORE"), deleteProduct);

// ─── Categories ───────────────────────────────────────────────────────────────
// Global (not store-scoped) — getCategories has no protectRoutes so any logged-in
// area of the app could read it too; add protectRoutes here if that's not desired.
router.post("/addCategory", protectRoutes, authorizeRoles("STORE"), uploadCategoryImage, createCategory);
router.get("/getCategories", getCategories);
router.get("/getSingleCategory/:id", protectRoutes, authorizeRoles("STORE"), getCategoryById);
router.put("/updateCategory/:id", protectRoutes, authorizeRoles("STORE"), uploadCategoryImage, updateCategory);
router.delete("/deleteCategory/:id", protectRoutes, authorizeRoles("STORE"), deleteCategory);

router.get("/orders", protectRoutes, authorizeRoles("STORE"), getStoreOrders);
router.get("/orders/:id", protectRoutes, authorizeRoles("STORE"), getStoreOrderDetail);
router.patch("/orders/:id/status", protectRoutes, authorizeRoles("STORE"), updateOrderStatus);

module.exports = router;