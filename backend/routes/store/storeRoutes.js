const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoutes");
const authorizeRoles = require("../../middleware/authorizeRoles");
const requireActiveStatus = require("../../middleware/requireActiveStatus");

const { uploadProductImages } = require("../../middleware/uploadProductImages");
const { uploadCategoryImage } = require("../../middleware/uploadCategoryImage");

const {
    getMyStoreProfile,
    updateStoreBranding,
    toggleManualClose,
    updateStoreStatus,
    updateStoreInfo,
    updateOperatingHours,
} = require("../../controllers/store/storeProfileController");
const { uploadStoreBranding } = require("../../middleware/uploadStoreBranding");
const { getDashboardSummary } = require("../../controllers/store/storeDashboardController");

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
    retryDriverSearch,
    cancelUndeliverableOrder,
} = require("../../controllers/store/storeOrdersController");

// GET /api/store/me (Accessible by pending/rejected accounts to display status page)
router.get("/me", protectRoutes, authorizeRoles("STORE"), getMyStoreProfile);

// Operational store routes require ACTIVE status
router.get("/dashboard/summary", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, getDashboardSummary);
router.patch("/branding", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, uploadStoreBranding, updateStoreBranding);
router.patch("/toggleManualClose", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, toggleManualClose);
router.patch("/status", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, updateStoreStatus);
router.patch("/info", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, updateStoreInfo);
router.patch("/hours", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, updateOperatingHours);

// ─── Products ─────────────────────────────────────────────────────────────────
router.post("/addProduct", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, uploadProductImages, createProduct);
router.get("/getProductsByStore", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, getProductsByStore);
router.get("/getSingleProduct/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, getProductById);
router.put("/updateProduct/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, uploadProductImages, updateProduct);
router.patch("/toggleAvailability/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, toggleAvailability);
router.patch("/updateStock/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, updateStock);
router.delete("/deleteProduct/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, deleteProduct);

// ─── Categories ───────────────────────────────────────────────────────────────
router.post("/addCategory", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, uploadCategoryImage, createCategory);
router.get("/getCategories", getCategories);
router.get("/getSingleCategory/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, getCategoryById);
router.put("/updateCategory/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, uploadCategoryImage, updateCategory);
router.delete("/deleteCategory/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, deleteCategory);

router.get("/orders", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, getStoreOrders);
router.get("/orders/:id", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, getStoreOrderDetail);
router.patch("/orders/:id/status", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, updateOrderStatus);
router.post("/orders/:id/retry-dispatch", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, retryDriverSearch);
router.patch("/orders/:id/cancel-undeliverable", protectRoutes, authorizeRoles("STORE"), requireActiveStatus, cancelUndeliverableOrder);

module.exports = router;