const Razorpay = require("razorpay");

/**
 * Configure Razorpay SDK instance for payment processing.
 */
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;