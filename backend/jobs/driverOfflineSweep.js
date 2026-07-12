const cron = require("node-cron");
const DriverProfile = require("../models/driver/driverProfile");
const { emitToDriver } = require("../socket");

// Same 5-minute window used to filter dispatch candidates — but here we
// actually flip the DB status instead of just excluding them from one query,
// so availabilityStatus stops silently drifting from reality.
const STALE_LOCATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Runs every minute — finds drivers still marked ONLINE whose last location
// ping is older than the stale threshold and forces them OFFLINE.
function startDriverOfflineSweep() {
    cron.schedule("*/1 * * * *", async () => {
        try {
            const cutoff = new Date(Date.now() - STALE_LOCATION_THRESHOLD_MS);

            const staleDrivers = await DriverProfile.find({
                availabilityStatus: "ONLINE",
                lastLocationUpdate: { $lt: cutoff },
            }).select("_id");

            if (!staleDrivers.length) return;

            await DriverProfile.updateMany(
                { _id: { $in: staleDrivers.map((d) => d._id) } },
                { availabilityStatus: "OFFLINE" }
            );

            staleDrivers.forEach((d) => {
                emitToDriver(d._id, "driver:forcedOffline", {
                    reason: "No location update for 5+ minutes.",
                });
            });

            console.log(`[driverOfflineSweep] Flipped ${staleDrivers.length} stale driver(s) to OFFLINE`);
        } catch (err) {
            console.error("[driverOfflineSweep] Sweep failed:", err.message);
        }
    });
    console.log("[driverOfflineSweep] Offline sweep scheduled (every 1 min)");
}

module.exports = { startDriverOfflineSweep };