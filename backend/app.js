const express = require("express")
const app = express()

const customerAuthRoutes = require("./routes/customer/authRoutes")

app.use("/api/auth", customerAuthRoutes)

module.exports = app