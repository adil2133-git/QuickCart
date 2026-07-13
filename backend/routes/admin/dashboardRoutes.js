const express = require("express");
const router = express.Router();
const protectRoute = require("../../middleware/protectRoutes");
const authorizeRoles = require("../../middleware/authorizeRoles");

const {
    getDashboardKpis,
    getOperationsIntelligence,
    getRecentOrders,
    getActionRail,
} = require("../../controllers/admin/dashboardController");

router.use(protectRoute);
router.use(authorizeRoles("ADMIN"));

router.get("/kpis", getDashboardKpis);
router.get("/operations", getOperationsIntelligence);
router.get("/recent-orders", getRecentOrders);
router.get("/action-rail", getActionRail);

module.exports = router;