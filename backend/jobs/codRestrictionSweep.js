const cron = require("node-cron");
const { sweepCodRestrictions } = require("../services/driverWalletService");

// runs every 15 minutes — SUSPENDED is a time-based tier (unsettled beyond
// the allowed window), so it needs a periodic check even without new COD
// activity from the driver. Also sends throttled settlement reminders.
function startCodRestrictionSweep() {
    cron.schedule("*/15 * * * *", async () => {
        try {
            const updated = await sweepCodRestrictions();
            if (updated > 0) {
                console.log(`[codRestrictionSweep] Updated ${updated} driver(s)`);
            }
        } catch (err) {
            console.error("[codRestrictionSweep] Sweep failed:", err.message);
        }
    });
    console.log("[codRestrictionSweep] COD restriction sweep scheduled (every 15 min)");
}

module.exports = { startCodRestrictionSweep };