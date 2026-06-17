const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoute");
const { getMyStoreProfile } = require("../../controllers/store/profile");

// GET /api/store/me
router.get("/me", protectRoutes, getMyStoreProfile);

module.exports = router;