const express = require("express")
const app = express()

app.use(express.json())

const customerAuthRoutes = require("./routes/customer/authRoutes")

app.use("/api/auth", customerAuthRoutes)

module.exports = app