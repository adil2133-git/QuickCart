const express = require("express")
const cors = require("cors")
const app = express()

app.use(express.json())

const AuthRoutes = require("./routes/auth/authRoutes")

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
)

app.use("/api/auth", AuthRoutes)

module.exports = app