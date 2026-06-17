require("dotenv").config()

const app = require("./app")
const connectDB = require("./config/db");
const {connectRedis} = require("./config/redis")

connectDB()
connectRedis()

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
});
