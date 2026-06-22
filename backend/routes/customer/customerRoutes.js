const express = require("express");
const router = express.Router();

const {
    getPublicStoreProfile,
} = require("../../controllers/store/storeProfileController");

const {
    getPublicStoreProducts,
    getStoreBestsellers,
} = require("../../controllers/store/productController");

const {
    getStoreRatingSummary,
    getStoreReviews,
} = require("../../controllers/store/storeReviewController");

// ════════════════════════════════════════════════════════════════════════════
//  Customer-facing store routes — no protectRoutes, storeId comes from the URL
//  Mount this at /api/stores (so final paths look like /api/stores/:storeId/...)
// ════════════════════════════════════════════════════════════════════════════

// ─── Store profile ────────────────────────────────────────────────────────────
// GET /api/stores/:storeId
router.get("/:storeId", getPublicStoreProfile);

// ─── Products ─────────────────────────────────────────────────────────────────
// GET /api/stores/:storeId/products
router.get("/:storeId/products", getPublicStoreProducts);

// GET /api/stores/:storeId/bestsellers
router.get("/:storeId/bestsellers", getStoreBestsellers);

// ─── Reviews ──────────────────────────────────────────────────────────────────
// GET /api/stores/:storeId/reviews/summary
router.get("/:storeId/reviews/summary", getStoreRatingSummary);

// GET /api/stores/:storeId/reviews
router.get("/:storeId/reviews", getStoreReviews);

module.exports = router;