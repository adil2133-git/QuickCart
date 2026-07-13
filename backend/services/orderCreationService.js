const mongoose = require("mongoose");
const Cart = require("../models/customer/cart");
const Product = require("../models/store/product");
const Order = require("../models/shared/order");
const User = require("../models/shared/user");
const CustomerProfile = require("../models/customer/customerProfile");
const StoreProfile = require("../models/store/storeProfile");
const { resolveCustomerProfile } = require("./customerProfileService");
const { sendOrderPlacedEmail, sendNewOrderStoreEmail } = require("./mailService");
const { notifyCustomer, notifyStore } = require("./notificationService");
const { computeBill, PricingError } = require("./pricingService");
const walletService = require("./walletService");

// Matches LOW_STOCK_THRESHOLD in storeDashboardController.js — keep in sync
// until this becomes a real per-store config value.
const LOW_STOCK_THRESHOLD = 10;

const formatAddress = (addr) => {
    if (!addr) return "";
    return addr.address;
};

// ─── Shared order creation ────────────────────────────────────────────────────
// Used by both the COD path (checkoutController.placeOrder) and the online
// payment path (paymentController.verifyPayment / fully-wallet-covered
// checkout). Re-validates stock, re-derives the store, and recomputes the
// bill server-side every time — nothing here ever trusts a client-supplied
// amount.
//
// Options:
//   userId              — req.user.userID
//   addressId            — selected saved address id
//   paymentMethod        — "COD" | "ONLINE"
//   paymentStatus        — "PENDING" | "PAID"
//   useWallet            — boolean, whether to apply wallet balance toward this order.
//                          Ignored for COD.
//   razorpayOrderId / razorpayPaymentId / razorpaySignature — set only when
//                          this order is being created after a verified Razorpay payment
const createOrderFromCart = async ({
    userId,
    addressId,
    paymentMethod,
    paymentStatus,
    useWallet = false,
    razorpayOrderId = undefined,
    razorpayPaymentId = undefined,
    razorpaySignature = undefined,
}) => {
    const profile = await resolveCustomerProfile(userId);

    const address = profile.savedAddresses.id(addressId);
    if (!address) {
        const err = new Error("Address not found.");
        err.status = 404;
        throw err;
    }

    const user = await User.findById(userId).select("name phone email").lean();
    if (!user) {
        const err = new Error("User not found.");
        err.status = 404;
        throw err;
    }

    const cart = await Cart.findOne({ customerId: profile._id });
    if (!cart || cart.products.length === 0) {
        const err = new Error("Your cart is empty.");
        err.status = 400;
        throw err;
    }

    // Re-fetch products fresh — never trust the price/quantity cached on the cart
    const productIds = cart.products.map((p) => p.productId);
    const products = await Product.find({ _id: { $in: productIds } })
        .select("productName price availabilityStatus stockQuantity storeId")
        .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderProducts = [];
    for (const item of cart.products) {
        const product = productMap.get(item.productId.toString());

        if (!product) {
            const err = new Error("One of the items in your cart is no longer available.");
            err.status = 400;
            throw err;
        }
        if (product.availabilityStatus !== "AVAILABLE" && product.availabilityStatus !== undefined) {
            const err = new Error(`${product.productName} is currently unavailable.`);
            err.status = 400;
            throw err;
        }
        if (item.quantity > product.stockQuantity) {
            const err = new Error(`Only ${product.stockQuantity} unit(s) of ${product.productName} available.`);
            err.status = 400;
            throw err;
        }

        orderProducts.push({
            productId: product._id,
            productName: product.productName,
            quantity: item.quantity,
            price: product.price, // always the current price, not the cart's cached price
        });
    }

    // All items must belong to a single store — re-derived here rather than trusted
    const storeId = products[0].storeId;
    const mismatched = products.some((p) => p.storeId.toString() !== storeId.toString());
    if (mismatched) {
        const err = new Error("Cart contains items from multiple stores. Please fix your cart before checking out.");
        err.status = 409;
        throw err;
    }

    const storeProfile = await StoreProfile.findById(storeId).select("coordinates storeName").lean();
    if (!storeProfile) {
        const err = new Error("Store not found.");
        err.status = 404;
        throw err;
    }

    const subtotal = orderProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

    let bill;
    try {
        bill = computeBill({
            subtotal,
            storeCoordinates: storeProfile.coordinates,
            addressCoordinates: address.coordinates,
        });
    } catch (err) {
        if (err instanceof PricingError) {
            err.status = err.status || 400;
        }
        throw err;
    }

    // Wallet only applies to ONLINE orders — COD stays a simple pay-on-delivery
    // flow, and combining wallet-credit with cash-on-delivery adds a
    // reconciliation case (driver collecting less cash than the order total)
    // that isn't worth the complexity right now.
    let walletAmountUsed = 0;
    if (paymentMethod === "ONLINE" && useWallet) {
        const balance = await walletService.getBalance(profile._id);
        walletAmountUsed = Math.min(balance, bill.totalAmount);
    }

    const session = await mongoose.startSession();
    let createdOrder;
    const stockAlerts = []; // { productName, stockQuantity } — filled during the decrement loop below

    try {
        await session.withTransaction(async () => {
            // Decrement stock for each product
            for (const item of orderProducts) {
                const updated = await Product.findOneAndUpdate(
                    { _id: item.productId, stockQuantity: { $gte: item.quantity } },
                    { $inc: { stockQuantity: -item.quantity } },
                    { session, returnDocument: "after" }
                );
                if (!updated) {
                    throw new Error(`Insufficient stock for ${item.productName}.`);
                }

                // Only alert the moment stock *crosses* into low/out-of-stock —
                // not on every order placed after it's already below threshold,
                // otherwise the store gets spammed with the same alert repeatedly.
                const preStock = productMap.get(item.productId.toString())?.stockQuantity ?? 0;
                if (preStock > LOW_STOCK_THRESHOLD && updated.stockQuantity <= LOW_STOCK_THRESHOLD) {
                    stockAlerts.push({ productName: item.productName, stockQuantity: updated.stockQuantity });
                }
            }

            createdOrder = await Order.create(
                [
                    {
                        customerId: profile._id,
                        storeId,
                        products: orderProducts,
                        subtotal: bill.subtotal,
                        deliveryCharge: bill.deliveryCharge,
                        handlingFee: bill.handlingFee,
                        totalAmount: bill.totalAmount,
                        paymentMethod,
                        paymentStatus,
                        walletAmountUsed,
                        razorpayOrderId,
                        razorpayPaymentId,
                        razorpaySignature,
                        deliveryAddress: formatAddress(address),
                        deliveryCoordinates: address.coordinates
                            ? { lat: address.coordinates.lat, lng: address.coordinates.lng }
                            : undefined,
                        recipientName: user.name,
                        recipientPhone: user.phone,
                    },
                ],
                { session }
            );

            if (walletAmountUsed > 0) {
                await walletService.debitForOrder({
                    customerId: profile._id,
                    amount: walletAmountUsed,
                    orderId: createdOrder[0]._id,
                    session,
                });
            }

            await Cart.findOneAndUpdate(
                { customerId: profile._id },
                { $set: { products: [], totalAmount: 0 } },
                { session }
            );

            await CustomerProfile.findByIdAndUpdate(
                profile._id,
                { $inc: { totalOrders: 1 } },
                { session }
            );
        });
    } finally {
        session.endSession();
    }

    const order = createdOrder[0];

    const { emitToStore } = require("../socket");
    emitToStore(storeId, "order:new", {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        recipientName: order.recipientName,
        totalAmount: order.totalAmount,
        itemCount: order.products.reduce((sum, p) => sum + p.quantity, 0),
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        placedAt: order.createdAt,
    });

    // Notify customer their order was received
    CustomerProfile.findById(order.customerId)
        .populate("userId", "_id")
        .lean()
        .then((cp) => {
            if (cp?.userId?._id) {
                notifyCustomer.orderPlaced(cp.userId._id, order.orderNumber, order._id).catch(() => {});
            }
        }).catch(() => {});

    // Fire-and-forget order emails — don't hold up the customer's response.
    StoreProfile.findById(storeId)
        .populate("userId", "name email")
        .lean()
        .then((sp) => {
            sendOrderPlacedEmail({
                toEmail: user.email,
                customerName: user.name,
                order,
                storeName: sp?.storeName || "the store",
            }).catch(() => {});

            if (sp?.userId?.email) {
                sendNewOrderStoreEmail({
                    toEmail: sp.userId.email,
                    storeName: sp.storeName,
                    order,
                }).catch(() => {});
            }

            if (sp?.userId?._id) {
                notifyStore.newOrder(sp.userId._id, order.orderNumber, order._id).catch(() => {});

                for (const alert of stockAlerts) {
                    if (alert.stockQuantity === 0) {
                        notifyStore.outOfStock(sp.userId._id, alert.productName).catch(() => {});
                    } else {
                        notifyStore.lowStock(sp.userId._id, alert.productName, alert.stockQuantity).catch(() => {});
                    }
                }
            }
        })
        .catch((err) => console.error("[order emails] Failed to resolve store:", err));

    return { order, walletAmountUsed, bill };
};

module.exports = { createOrderFromCart };