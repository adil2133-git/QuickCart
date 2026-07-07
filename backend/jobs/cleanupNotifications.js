const cron = require("node-cron");
const Notification = require("../models/shared/notification");

// Runs every Sunday at 2 AM — deletes notifications past their 90-day expiresAt
function startNotificationCleanup() {
    cron.schedule("0 2 * * 0", async () => {
        try {
            const result = await Notification.deleteMany({ expiresAt: { $lt: new Date() } });
            console.log(`[cleanup] Deleted ${result.deletedCount} expired notifications`);
        } catch (err) {
            console.error("[cleanup] Notification cleanup failed:", err.message);
        }
    });
    console.log("[cleanup] Notification cleanup scheduled (Sun 2 AM)");
}

module.exports = { startNotificationCleanup };