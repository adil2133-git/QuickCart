const crypto = require("crypto");
const razorpay = require("../../config/razorpay");
const Order = require("../../models/shared/order");
const { createOrderFromCart } = require("../../services/orderCreationService");

// POST /api/webhooks/razorpay
// Safety net for payments Razorpay captured but the browser never confirmed
// (closed tab, crashed app, lost network right after paying). Razorpay calls
// this server-to-server, so it's verified via a signature over the raw
// request body using the webhook secret, not the usual cookie/JWT auth.
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

        // only payment.captured can leave money unreconciled on our side
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

        // the browser's verify-payment call usually beats the webhook here —
        // if the order already exists, there's nothing left to do
        const existing = await Order.findOne({ razorpayOrderId }).select("_id").lean();
        if (existing) {
            return res.status(200).json({ success: true, alreadyHandled: true });
        }

        // not handled yet — pull the userId/addressId stashed in the
        // Razorpay order's notes at create-order time, since the webhook
        // payload itself has no idea which cart this payment was for
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
                razorpaySignature: null, // verified via the webhook signature, not the client-side one
            });
            console.log(`[razorpayWebhook] Recovered order for payment ${razorpayPaymentId} (client never confirmed).`);
        } catch (err) {
            // duplicate key just means verify-payment won the race between
            // our check above and now — the order exists either way
            if (err.code === 11000) {
                return res.status(200).json({ success: true, alreadyHandled: true });
            }
            // anything else (stock ran out, cart emptied since payment) means
            // the payment was captured but we genuinely can't place the order
            console.error(`[razorpayWebhook] Could not recover order for payment ${razorpayPaymentId}:`, err.message);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[razorpayWebhook] Handler failed:", err);
        // still 200 — Razorpay retries non-2xx responses, and retrying
        // a handler that just threw won't help; the failure is already logged
        return res.status(200).json({ success: false });
    }
};

module.exports = { handleRazorpayWebhook };