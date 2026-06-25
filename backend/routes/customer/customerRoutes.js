const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoute");

const {
    getProfile,
    addAddress,
    setDefaultAddress,
    deleteAddress,
    getNearbyStores,
    getPopularProducts,
    getTrendingProducts,
    getCategories,
} = require("../../controllers/customer/customerController");

const {
    getPublicStoreProfile,
} = require("../../controllers/store/storeProfileController");

const {
    getPublicStoreProducts,
    getStoreBestsellers,
    getPublicProductDetail,
} = require("../../controllers/store/productController");

const {
    getStoreRatingSummary,
    getStoreReviews,
} = require("../../controllers/store/storeReviewController");

const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} = require("../../controllers/customer/cartController");

// ════════════════════════════════════════════════════════════════════════════
//  All routes mounted at /api/customer
// ════════════════════════════════════════════════════════════════════════════

// ─── Profile & Addresses (protected) ─────────────────────────────────────────
router.get("/profile", protectRoutes, getProfile);
router.post("/address", protectRoutes, addAddress);
router.patch("/address/:id/default", protectRoutes, setDefaultAddress);
router.delete("/address/:id", protectRoutes, deleteAddress);

// ─── Discovery (protected) ────────────────────────────────────────────────────
router.get("/stores/nearby", protectRoutes, getNearbyStores);
router.get("/products/popular", protectRoutes, getPopularProducts);
router.get("/products/trending", protectRoutes, getTrendingProducts);
router.get("/categories", getCategories); // public
 
// ─── Cart routes must stay before the dynamic /:storeId route ──────────────
router.get("/cart", protectRoutes, getCart);
router.post("/cart/add", protectRoutes, addToCart);
router.patch("/cart/item/:productId", protectRoutes, updateCartItem);
router.delete("/cart/item/:productId", protectRoutes, removeFromCart);
router.delete("/cart", protectRoutes, clearCart);

// ─── Single Store Page (public, storeId from URL) ─────────────────────────────
router.get("/:storeId", getPublicStoreProfile);
router.get("/:storeId/products", getPublicStoreProducts);
router.get("/:storeId/products/:productId", getPublicProductDetail);
router.get("/:storeId/bestsellers", getStoreBestsellers);
router.get("/:storeId/reviews/summary", getStoreRatingSummary);
router.get("/:storeId/reviews", getStoreReviews);

module.exports = router;