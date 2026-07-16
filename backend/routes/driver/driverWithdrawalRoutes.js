const express = require("express");
const router = express.Router();

const protectRoute = require("../../middleware/protectRoutes");
const authorizeRoles = require("../../middleware/authorizeRoles");
const {
    getWithdrawalRequests,
    reviewWithdrawalRequest,
} = require("../../controllers/admin/driverWithdrawalController");

router.use(protectRoute);
router.use(authorizeRoles("ADMIN"));

router.get("/withdrawals", getWithdrawalRequests);
router.post("/withdrawals/:id/decision", reviewWithdrawalRequest);

module.exports = router;