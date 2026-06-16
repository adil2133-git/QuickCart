const express = require("express")
const cors = require("cors")
const app = express()

app.use(express.json())

const AuthRoutes = require("./routes/auth/authRoutes")
const DriverRoutes = require("./routes/driver/driverRoutes")

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
)

app.use("/api/auth", AuthRoutes)
app.use("/api/auth/driver", DriverRoutes)

module.exports = app