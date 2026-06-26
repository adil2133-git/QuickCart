const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoute");

const {
    getDeliveryRequests,
    acceptDeliveryRequest,
    declineDeliveryRequest,
    getActiveDelivery,
    advanceDeliveryStage,
    confirmCashCollected,
    getCompletedDeliveries,
    getTodayStats,
    updateAvailability,
} = require("../../controllers/driver/driverDeliveryController");

// All routes require a valid JWT
router.use(protectRoutes);

// ── Delivery requests (broadcast from store accept) ──────────────────────────
router.get("/deliveries/requests", getDeliveryRequests);
router.post("/deliveries/requests/:requestId/accept", acceptDeliveryRequest);
router.post("/deliveries/requests/:requestId/decline", declineDeliveryRequest);

// ── Active delivery ───────────────────────────────────────────────────────────
router.get("/deliveries/active", getActiveDelivery);
router.patch("/deliveries/:orderId/stage", advanceDeliveryStage);
router.post("/deliveries/:orderId/cash-collected", confirmCashCollected);

// ── History & stats ───────────────────────────────────────────────────────────
router.get("/deliveries/completed", getCompletedDeliveries);
router.get("/deliveries/stats/today", getTodayStats);

// ── Online/offline toggle ─────────────────────────────────────────────────────
router.patch("/availability", updateAvailability);

module.exports = router;