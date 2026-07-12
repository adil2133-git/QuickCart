const cron = require("node-cron");
const Order = require("../models/shared/order");
const { dispatchRound } = require("../services/deliveryDispatchService");

// Runs every 15 seconds — finds orders stuck at READY_FOR_PICKUP whose
// current dispatch round has expired with no driver accepting, and sends
// the next round (wider radius, previously-declined drivers excluded).
// dispatchRound itself marks driverSearchFailed once MAX_DISPATCH_ROUNDS is
// exhausted, so this job just keeps sweeping — it doesn't need round limits.
function startDeliveryRequestRetry() {
    cron.schedule("*/15 * * * * *", async () => {
        try {
            const staleOrders = await Order.find({
                orderStatus: "READY_FOR_PICKUP",
                driverId: null,
                driverSearchFailed: false,
                deliveryRoundExpiresAt: { $lte: new Date() },
            }).select("_id");

            if (!staleOrders.length) return;

            for (const order of staleOrders) {
                await dispatchRound(order._id).catch((err) =>
                    console.error(`[deliveryRequestRetry] Order ${order._id} failed:`, err.message)
                );
            }
        } catch (err) {
            console.error("[deliveryRequestRetry] Sweep failed:", err.message);
        }
    });
    console.log("[deliveryRequestRetry] Retry sweep scheduled (every 15s)");
}

module.exports = { startDeliveryRequestRetry };