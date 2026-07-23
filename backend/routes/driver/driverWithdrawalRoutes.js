const express = require("express");
const router = express.Router();

const protectRoute = require("../../middleware/protectRoutes");
const authorizeRoles = require("../../middleware/authorizeRoles");
const {
    getWithdrawalRequests,
} = require("../../controllers/driver/driverWithdrawalController");

router.use(protectRoute);
router.use(authorizeRoles("ADMIN"));

router.get("/withdrawals", getWithdrawalRequests);

module.exports = router;