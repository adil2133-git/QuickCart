const express = require("express");
const router = express.Router();
const { handleRazorpayWebhook } = require("../../controllers/webhooks/razorpayWebhookController");

// No protectRoutes/authorizeRoles here — Razorpay's servers call this
// directly, not the browser, so there's no JWT/cookie to check. Authenticity
// is verified inside the controller via the X-Razorpay-Signature header.
router.post("/razorpay", handleRazorpayWebhook);

module.exports = router;