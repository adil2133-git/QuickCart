const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoutes");
const authorizeRoles = require("../../middleware/authorizeRoles");

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

const {
    getCheckoutSummary,
    placeOrder,
} = require("../../controllers/customer/checkoutController");

const {
    getOrders,
    getOrderDetail,
    cancelOrder,
} = require("../../controllers/customer/ordersController");

const { getRecentlyOrdered } = require("../../controllers/customer/homeController");

// ════════════════════════════════════════════════════════════════════════════
//  All routes mounted at /api/customer
// ════════════════════════════════════════════════════════════════════════════

// ─── Profile & Addresses (protected) ─────────────────────────────────────────
router.get("/profile", protectRoutes, authorizeRoles("CUSTOMER"), getProfile);
router.post("/address", protectRoutes, authorizeRoles("CUSTOMER"), addAddress);
router.patch("/address/:id/default", protectRoutes, authorizeRoles("CUSTOMER"), setDefaultAddress);
router.delete("/address/:id", protectRoutes, authorizeRoles("CUSTOMER"), deleteAddress);

// ─── Discovery (protected) ────────────────────────────────────────────────────
router.get("/stores/nearby", protectRoutes, authorizeRoles("CUSTOMER"), getNearbyStores);
router.get("/products/popular", protectRoutes, authorizeRoles("CUSTOMER"), getPopularProducts);
router.get("/home/recent-orders", protectRoutes, authorizeRoles("CUSTOMER"), getRecentlyOrdered);
router.get("/products/trending", protectRoutes, authorizeRoles("CUSTOMER"), getTrendingProducts);
router.get("/categories", getCategories); // public

// ─── Cart routes must stay before the dynamic /:storeId route ──────────────
router.get("/cart", protectRoutes, authorizeRoles("CUSTOMER"), getCart);
router.post("/cart/add", protectRoutes, authorizeRoles("CUSTOMER"), addToCart);
router.patch("/cart/item/:productId", protectRoutes, authorizeRoles("CUSTOMER"), updateCartItem);
router.delete("/cart/item/:productId", protectRoutes, authorizeRoles("CUSTOMER"), removeFromCart);
router.delete("/cart", protectRoutes, authorizeRoles("CUSTOMER"), clearCart);

router.get("/checkout/summary", protectRoutes, authorizeRoles("CUSTOMER"), getCheckoutSummary);
router.post("/checkout/place-order", protectRoutes, authorizeRoles("CUSTOMER"), placeOrder);

router.get("/orders", protectRoutes, authorizeRoles("CUSTOMER"), getOrders);
router.get("/orders/:id", protectRoutes, authorizeRoles("CUSTOMER"), getOrderDetail);
router.patch("/orders/:id/cancel", protectRoutes, authorizeRoles("CUSTOMER"), cancelOrder);

// ─── Single Store Page (public, storeId from URL) ─────────────────────────────
router.get("/:storeId", getPublicStoreProfile);
router.get("/:storeId/products", getPublicStoreProducts);
router.get("/:storeId/products/:productId", getPublicProductDetail);
router.get("/:storeId/bestsellers", getStoreBestsellers);
router.get("/:storeId/reviews/summary", getStoreRatingSummary);
router.get("/:storeId/reviews", getStoreReviews);

module.exports = router;