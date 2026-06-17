const express = require("express");
const router = express.Router();

const protectRoutes = require("../../middleware/protectRoute");
const { getMyDriverProfile } = require("../../controllers/driver/profile");

// GET /api/driver/me
router.get("/me", protectRoutes, getMyDriverProfile);

module.exports = router;