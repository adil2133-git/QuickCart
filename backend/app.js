const express = require("express")
const cors = require("cors")
const app = express()

app.use(express.json())

const customerAuthRoutes = require("./routes/customer/authRoutes")

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
)

app.use("/api/auth", customerAuthRoutes)

module.exports = app