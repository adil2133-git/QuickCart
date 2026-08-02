const rateLimit = require("express-rate-limit");

/**
 * Login rate limiter: Max 10 attempts per 15-minute window.
 * Keyed by IP + normalized email to protect shared WiFi / mobile NAT environments.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP + Email to 10 login requests per windowMs
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

module.exports = loginRateLimiter;
