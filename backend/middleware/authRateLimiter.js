let rateLimit;
try {
  rateLimit = require("express-rate-limit");
} catch (err) {
  console.warn("[WARN] 'express-rate-limit' module not found in node_modules. Falling back to pass-through rate limiter.");
}

const dummyLimiter = (req, res, next) => next();

// Login rate limiter: Max 10 attempts per 15-minute window (IP + email)
const loginRateLimiter = rateLimit
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
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
    })
  : dummyLimiter;

// OTP dispatch rate limiter: Max 5 requests per 15-minute window
const otpRateLimiter = rateLimit
  ? rateLimit({
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
    })
  : dummyLimiter;

module.exports = {
  loginRateLimiter,
  otpRateLimiter,
};
