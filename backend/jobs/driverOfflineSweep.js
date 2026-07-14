const cron = require("node-cron");
const DriverProfile = require("../models/driver/driverProfile");
const { emitToDriver } = require("../socket");

// same window used to filter dispatch candidates, but here we actually
// flip the DB status so availabilityStatus doesn't silently drift from reality
const STALE_LOCATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// runs every minute — forces any driver still marked ONLINE with a stale
// location ping to OFFLINE
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