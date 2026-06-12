const connectDB = require("./config/db");
const {connectRedis} = require("./config/redis")
require("dotenv").config()

const express = require("express")

const app = express()

connectDB()
connectRedis()

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
});
