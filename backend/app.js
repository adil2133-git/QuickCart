const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser") 
const app = express()

app.use(express.json())
app.use(cookieParser()) 

const AuthRoutes = require("./routes/auth/authRoutes")
const DriverRoutes = require("./routes/driver/driverRoutes")
const StoreRoutes = require("./routes/store/storeRoutes")
const DriverApplicationRoutes = require("./routes/admin/driverApplicationRoutes")
const StoreApplicationRoutes = require("./routes/admin/storeApplicationRoutes")
const CustomerRoutes = require("./routes/customer/customerRoutes")


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
)

app.use("/api/auth", AuthRoutes)
app.use("/api/driver", DriverRoutes)
app.use("/api/customer", CustomerRoutes)
app.use("/api/store", StoreRoutes)

app.use("/api/admin/driver", DriverApplicationRoutes)
app.use("/api/admin/store", StoreApplicationRoutes)


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

module.exports = app