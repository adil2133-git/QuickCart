/**
 * QuickCart Backend Server Entrypoint
 * Initializes database connections, HTTP & WebSocket servers, and starts background crons.
 */
require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const { initSocket } = require("./socket");

// Background jobs
const { startNotificationCleanup } = require("./jobs/cleanupNotifications");
const { startDeliveryRequestRetry } = require("./jobs/deliveryRequestRetry");
const { startDriverOfflineSweep } = require("./jobs/driverOfflineSweep");
const { startWalletSettlement } = require("./jobs/walletSettlement");
const { startCodRestrictionSweep } = require("./jobs/codRestrictionSweep");

// Initialize Database Connections
connectDB();
connectRedis();

// Initialize HTTP & WebSocket Server
const httpServer = http.createServer(app);
initSocket(httpServer);

// Start Background Services
startNotificationCleanup();
startDeliveryRequestRetry();
startDriverOfflineSweep();
startWalletSettlement();
startCodRestrictionSweep();

// Server Listen setup
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});