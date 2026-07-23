const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Parse allowed CORS origins from environment
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

// Body parser with raw body retention for webhook verification (e.g. Razorpay)
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(cookieParser());

// Route Imports
const AuthRoutes = require("./routes/auth/authRoutes");
const DriverRoutes = require("./routes/driver/driverRoutes");
const StoreRoutes = require("./routes/store/storeRoutes");
const DriverApplicationRoutes = require("./routes/admin/driverApplicationRoutes");
const StoreApplicationRoutes = require("./routes/admin/storeApplicationRoutes");
const AdminDashboardRoutes = require("./routes/admin/dashboardRoutes");
const DriverWithdrawalRoutes = require("./routes/driver/driverWithdrawalRoutes");
const CustomerRoutes = require("./routes/customer/customerRoutes");
const notificationRoutes = require("./routes/shared/notificationRoutes");
const RazorpayWebhookRoutes = require("./routes/webhooks/razorpayWebhookRoutes");

// CORS Configuration
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS blocked for origin: ${origin}`));
            }
        },
        credentials: true,
    })
);

// API Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/driver", DriverRoutes);
app.use("/api/customer", CustomerRoutes);
app.use("/api/store", StoreRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks", RazorpayWebhookRoutes);

// Admin Routes
app.use("/api/admin/driver", DriverApplicationRoutes);
app.use("/api/admin/driver", DriverWithdrawalRoutes);
app.use("/api/admin/store", StoreApplicationRoutes);
app.use("/api/admin/dashboard", AdminDashboardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("=== GLOBAL ERROR HANDLER ===");
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);
    console.error("Full error object:", err);
    console.error("=============================");

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

module.exports = app;