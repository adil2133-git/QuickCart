const cron = require("node-cron");
const { settlePendingEarnings } = require("../services/driverWalletService");

// runs every 10 minutes — moves any DriverEarnings whose 24h (T+1) window
// has passed from pendingBalance into availableBalance
function startWalletSettlement() {
    cron.schedule("*/10 * * * *", async () => {
        try {
            const count = await settlePendingEarnings();
            if (count > 0) {
                console.log(`[walletSettlement] Settled ${count} earning(s) to available balance`);
            }
        } catch (err) {
            console.error("[walletSettlement] Sweep failed:", err.message);
        }
    });
    console.log("[walletSettlement] T+1 settlement scheduled (every 10 min)");
}

module.exports = { startWalletSettlement };