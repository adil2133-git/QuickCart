const express = require("express");
const router = express.Router();
const protectRoute = require("../../middleware/protectRoute"); 
const authorizeRoles = require("../../middleware/authorizeRoles"); 
const {
    getDriverApplications,
    getDriverApplicationStats,
    getDriverApplicationById,
    addDriverReviewNote,
    submitDriverDecision,
} = require("../../controllers/admin/driverApplicationController");

router.use(protectRoute);
router.use(authorizeRoles("admin"))

router.get("/applications", getDriverApplications);
router.get("/applications/stats", getDriverApplicationStats);
router.get("/applications/:id", getDriverApplicationById);
router.post("/applications/:id/notes", addDriverReviewNote);
router.post("/applications/:id/decision", submitDriverDecision);

module.exports = router;