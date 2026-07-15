const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoutes");
const authorizeRoles = require("../../middleware/authorizeRoles");

const {
    getDeliveryRequests,
    acceptDeliveryRequest,
    declineDeliveryRequest,
    getActiveDelivery,
    advanceDeliveryStage,
    confirmCashCollected,
    getCompletedDeliveries,
    getTodayStats,
    getEarningsSummary,
    updateAvailability,
} = require("../../controllers/driver/driverDeliveryController");
const { updateLocation } = require("../../controllers/driver/driverLocationController");
const { getMyDriverProfile } = require("../../controllers/driver/driverProfileController");

router.use(protectRoutes);
router.use(authorizeRoles("DRIVER"));

// profile (includes availabilityStatus)
router.get("/me", getMyDriverProfile);

// delivery requests — broadcast from the store's dispatch service
router.get("/deliveries/requests", getDeliveryRequests);
router.post("/deliveries/requests/:requestId/accept", acceptDeliveryRequest);
router.post("/deliveries/requests/:requestId/decline", declineDeliveryRequest);

// active delivery
router.get("/deliveries/active", getActiveDelivery);
router.patch("/deliveries/:orderId/stage", advanceDeliveryStage);
router.post("/deliveries/:orderId/cash-collected", confirmCashCollected);

// history & stats
router.get("/deliveries/completed", getCompletedDeliveries);
router.get("/deliveries/stats/today", getTodayStats);
router.get("/earnings", getEarningsSummary);

// online/offline toggle + live location ping
router.patch("/availability", updateAvailability);
router.patch("/location", updateLocation);

module.exports = router;