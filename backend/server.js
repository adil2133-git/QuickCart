require("dotenv").config()

const http = require("http");
const app = require("./app")
const connectDB = require("./config/db");
const {connectRedis} = require("./config/redis")
const { initSocket } = require("./socket");
const { startNotificationCleanup } = require("./jobs/cleanupNotifications");
const { startDeliveryRequestRetry } = require("./jobs/deliveryRequestRetry");
const { startDriverOfflineSweep } = require("./jobs/driverOfflineSweep");
const { startWalletSettlement } = require("./jobs/walletSettlement");
const { startCodRestrictionSweep } = require("./jobs/codRestrictionSweep");


connectDB()
connectRedis()

const httpServer = http.createServer(app);
initSocket(httpServer);
startNotificationCleanup();
startDeliveryRequestRetry();
startDriverOfflineSweep();
startWalletSettlement();
startCodRestrictionSweep();

httpServer.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
});