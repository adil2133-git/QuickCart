const crypto = require("crypto");
const razorpay = require("../../config/razorpay");
const Cart = require("../../models/customer/cart");
const StoreProfile = require("../../models/store/storeProfile");
const { resolveCustomerProfile } = require("../../services/customerProfileService");
const { computeBill, PricingError } = require("../../services/pricingService");
const walletService = require("../../services/walletService");
const { createOrderFromCart } = require("../../services/orderCreationService");

// ─── Shared: recompute the bill for a given address, server-side ────────────
// Never trust an amount the client sends — this is the single place both
// createRazorpayOrder and verifyPayment go to find out what the order
// actually costs right now.
const computeCurrentBill = async (profile, addressId) => {
    const address = profile.savedAddresses.id(addressId);
    if (!address) {
        const err = new Error("Address not found.");
        err.status = 404;
        throw err;
    }

    const cart = await Cart.findOne({ customerId: profile._id })
        .populate({ path: "products.productId", select: "price storeId" })
        .lean();

    if (!cart || cart.products.length === 0) {
        const err = new Error("Your cart is empty.");
        err.status = 400;
        throw err;
    }

    const subtotal = cart.products.reduce(
        (sum, p) => sum + (p.productId?.price ?? p.price) * p.quantity,
        0
    );
    const storeId = cart.products[0]?.productId?.storeId;
    const storeProfile = storeId
        ? await StoreProfile.findById(storeId).select("coordinates").lean()
        : null;

    const bill = computeBill({
        subtotal,
        storeCoordinates: storeProfile?.coordinates,
        addressCoordinates: address.coordinates,
    });

    return bill;
};

// ─── POST /api/customer/payment/create-order ─────────────────────────────────
// Body: { addressId, useWallet? }
// Computes the real bill, optionally applies wallet balance, and either:
//   - the wallet fully covers it -> places the order immediately, no Razorpay
//     involved at all
//   - otherwise -> creates a Razorpay order for the remaining amount and
//     returns it for the frontend to open Checkout.js with
const createRazorpayOrder = async (req, res) => {
    try {
        const { addressId, useWallet } = req.body;
        if (!addressId) {
            return res.status(400).json({ success: false, message: "addressId is required." });
        }

        const profile = await resolveCustomerProfile(req.user.userID);
        const bill = await computeCurrentBill(profile, addressId);

        const walletBalance = await walletService.getBalance(profile._id);
        const walletAmountUsed = useWallet ? Math.min(walletBalance, bill.totalAmount) : 0;
        const amountToPay = bill.totalAmount - walletAmountUsed;

        // Wallet alone covers the order -- place it now, skip Razorpay entirely.
        if (amountToPay <= 0) {
            const { order } = await createOrderFromCart({
                userId: req.user.userID,
                addressId,
                paymentMethod: "ONLINE",
                paymentStatus: "PAID",
                useWallet: true,
            });

            return res.status(201).json({
                success: true,
                fullyCoveredByWallet: true,
                message: "Order placed using wallet balance.",
                order,
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amountToPay * 100), // paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        return res.status(200).json({
            success: true,
            fullyCoveredByWallet: false,
            razorpayOrder,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            totals: bill,
            walletAmountUsed,
            amountToPay,
        });
    } catch (err) {
        console.error("CREATE RAZORPAY ORDER ERROR:", err);
        const status = err.status || (err instanceof PricingError ? 400 : 500);
        return res.status(status).json({
            success: false,
            message: status === 500 ? "Could not start payment. Please try again." : err.message,
        });
    }
};

// ─── POST /api/customer/payment/verify-payment ───────────────────────────────
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId, useWallet? }
// Verifies the signature, then places the order via the same shared path COD
// uses -- stock/price/bill are all re-validated fresh, nothing here trusts
// what the client sent earlier at create-order time.
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId,
            useWallet,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment details." });
        }
        if (!addressId) {
            return res.status(400).json({ success: false, message: "addressId is required." });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed.",
            });
        }

        const { order } = await createOrderFromCart({
            userId: req.user.userID,
            addressId,
            paymentMethod: "ONLINE",
            paymentStatus: "PAID",
            useWallet: !!useWallet,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
        });

        return res.status(201).json({
            success: true,
            message: "Payment successful. Order placed.",
            order,
        });
    } catch (err) {
        console.error("VERIFY PAYMENT ERROR:", err);
        // Payment was already captured by Razorpay at this point, but the order
        // failed to place (e.g. stock ran out between create-order and verify).
        // This needs a human to look at it, not a silent 500 -- flagging clearly
        // in the response so the frontend can show "contact support" rather
        // than a generic retry, since retrying won't re-attempt the same payment.
        const status = err.status || 500;
        return res.status(status).json({
            success: false,
            paymentCapturedButOrderFailed: true,
            message:
                status === 500
                    ? "Payment succeeded but we couldn't place your order. Please contact support with your payment ID."
                    : err.message,
        });
    }
};

module.exports = { createRazorpayOrder, verifyPayment };