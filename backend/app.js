const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Trust reverse proxy (AWS ALB / Nginx / App Runner) for HTTPS cookie recognition
app.set("trust proxy", 1);


const { corsOptions } = require("./utils/corsOptions");

// CORS Configuration
app.use(cors(corsOptions));

// Body parser with raw body retention for webhook verification (e.g. Razorpay)
app.use(express.json({
    limit: "50mb",
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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