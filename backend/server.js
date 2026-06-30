require("dotenv").config()

const http = require("http");
const app = require("./app")
const connectDB = require("./config/db");
const {connectRedis} = require("./config/redis")
const { initSocket } = require("./socket");

connectDB()
connectRedis()

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
});