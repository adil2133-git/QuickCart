const rateLimit = require("express-rate-limit");

/**
 * Login rate limiter: Max 10 attempts per 15-minute window.
 * Keyed by IP + normalized email to protect shared WiFi / mobile NAT environments.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || "").toString().trim().toLowerCase();
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    return `${ip}:${email}`;
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Please wait 15 minutes before trying again.",
      title: "Too Many Attempts",
    });
  },
});

/**
 * OTP dispatch rate limiter: Max 5 OTP requests per 15-minute window.
 */
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || "").toString().trim().toLowerCase();
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    return `otp:${ip}:${email}`;
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many OTP requests. Please wait 15 minutes before trying again.",
      title: "Too Many Requests",
    });
  },
});

module.exports = {
  loginRateLimiter,
  otpRateLimiter,
};
