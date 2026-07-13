const crypto = require("crypto");
const razorpay = require("../../config/razorpay");
const Order = require("../../models/shared/order");
const { createOrderFromCart } = require("../../services/orderCreationService");

// ─── POST /api/webhooks/razorpay ─────────────────────────────────────────────
// Safety net for the case where Razorpay captures a payment but the browser
// never calls /payment/verify-payment — closed tab, crashed app, lost network
// right after paying. Without this, that money is captured with zero record
// on our side. Razorpay calls this server-to-server, so it isn't protected by
// the usual JWT/cookie auth — verified instead via a signature over the raw
// request body, using the separate webhook secret from the Razorpay
// dashboard (Settings -> Webhooks), NOT the API key secret.
const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        if (!signature || !req.rawBody) {
            return res.status(400).json({ success: false, message: "Missing signature." });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(req.rawBody)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.warn("[razorpayWebhook] Signature mismatch — rejecting.");
            return res.status(400).json({ success: false, message: "Invalid signature." });
        }

        const event = req.body?.event;

        // Only payment.captured can ever need us to create an order. Every
        // other event (failed, authorized, refunded, etc.) has no money
        // sitting unreconciled, so there's nothing for this safety net to do.
        if (event !== "payment.captured") {
            return res.status(200).json({ success: true });
        }

        const payment = req.body?.payload?.payment?.entity;
        const razorpayOrderId = payment?.order_id;
        const razorpayPaymentId = payment?.id;

        if (!razorpayOrderId || !razorpayPaymentId) {
            console.warn("[razorpayWebhook] payment.captured with no order/payment id — ignoring.");
            return res.status(200).json({ success: true });
        }

        // Already handled — the browser's verify-payment call beat the
        // webhook here, which is the common, expected case. Nothing to do.
        const existing = await Order.findOne({ razorpayOrderId }).select("_id").lean();
        if (existing) {
            return res.status(200).json({ success: true, alreadyHandled: true });
        }

        // Not handled yet — this IS the safety-net case. Pull the userId /
        // addressId / useWallet stashed in the Razorpay order's notes at
        // create-order time (see paymentController.js) — the webhook payload
        // itself has no idea which cart/address this payment was for.
        const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
        const notes = razorpayOrder?.notes || {};
        const { userId, addressId, useWallet } = notes;

        if (!userId || !addressId) {
            console.error(
                `[razorpayWebhook] payment ${razorpayPaymentId} captured but order ${razorpayOrderId} has no usable notes — needs manual reconciliation.`
            );
            return res.status(200).json({ success: true });
        }

        try {
            await createOrderFromCart({
                userId,
                addressId,
                paymentMethod: "ONLINE",
                paymentStatus: "PAID",
                useWallet: useWallet === "true",
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature: null, // verified here via the webhook signature, not the client-side one
            });
            console.log(`[razorpayWebhook] Recovered order for payment ${razorpayPaymentId} (client never confirmed).`);
        } catch (err) {
            // A duplicate-key error just means verify-payment won the race
            // between our existence check above and now — harmless, the
            // order already exists either way.
            if (err.code === 11000) {
                return res.status(200).json({ success: true, alreadyHandled: true });
            }
            // Anything else (stock ran out, cart emptied since payment,
            // etc.) means we genuinely can't place the order even though the
            // payment was captured — this needs a human, not a silent drop.
            console.error(`[razorpayWebhook] Could not recover order for payment ${razorpayPaymentId}:`, err.message);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[razorpayWebhook] Handler failed:", err);
        // Still 200 — Razorpay retries non-2xx responses, and retrying a
        // handler that just threw doesn't help; the failure is already logged.
        return res.status(200).json({ success: false });
    }
};

module.exports = { handleRazorpayWebhook };