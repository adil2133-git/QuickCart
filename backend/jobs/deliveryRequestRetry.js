const cron = require("node-cron");
const Order = require("../models/shared/order");
const { dispatchRound } = require("../services/deliveryDispatchService");

// runs every 15s — finds orders whose current dispatch round expired
// with no driver accepting, and kicks off the next round.
// dispatchRound handles marking driverSearchFailed once rounds run out,
// so this job doesn't need to track round limits itself.
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