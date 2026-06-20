const express = require("express");
const router = express.Router();
const protectRoute = require("../../middleware/protectRoute");
const {
    getStoreApplications,
    getStoreApplicationStats,
    getStoreApplicationById,
    addStoreReviewNote,
    submitStoreDecision,
} = require("../../controllers/admin/storeApplicationController");

router.use(protectRoute);

router.get("/applications", getStoreApplications);
router.get("/applications/stats", getStoreApplicationStats);
router.get("/applications/:id", getStoreApplicationById);
router.post("/applications/:id/notes", addStoreReviewNote);
router.post("/applications/:id/decision", submitStoreDecision);

module.exports = router;