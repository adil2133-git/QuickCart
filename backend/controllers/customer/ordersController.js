const Order = require("../../models/shared/order");
const Product = require("../../models/store/product");
const StoreProfile = require("../../models/store/storeProfile");
const CustomerProfile = require("../../models/customer/customerProfile");
const { resolveCustomerProfile } = require("../../services/customerProfileService");
const { emitToStore, emitToCustomer } = require("../../socket");
const { notifyStore, notifyCustomer } = require("../../services/notificationService");
const { sendOrderCancelledEmail } = require("../../services/mailService");
const walletService = require("../../services/walletService");

// Cancellation compensation, per "Money Handling & Business Rules" Section 12.
// Only the two stages a customer can self-cancel from apply here -- store
// keeps a slice of the handling fee as compensation for work already done,
// and the customer gets the rest back automatically, credited to their
// wallet (never a real-money gateway refund, so this can safely be instant).
const REFUND_DEDUCTION_BY_STATUS = {
    PENDING: 0,
    ACCEPTED: 0,
    PACKING: 20, // store has started packing -- keeps ₹20 of the handling fee
};

// KNOWN GAP (documented in Money Handling & Business Rules, Section 15):
// both paths below now correctly *collect* ₹20 from the customer once packing
// has started -- reduced from their refund (PAID) or deducted from their
// wallet (COD, via debitCancellationFee). What's still missing is the other
// side: that ₹20 is never actually credited to the store anywhere
// (StoreTransaction is never written to by any controller). So today the
// money is taken from the customer correctly, but it doesn't yet land
// anywhere -- it should end up as store income once the store wallet/
// settlement system exists.

const resolveCustomerId = async (req) => {
    const profile = await resolveCustomerProfile(req.user.userID);
    return profile._id;
};

const STAGE_FOR_STATUS = {
    PENDING: "PROCESSING",
    ACCEPTED: "PROCESSING",
    PACKING: "PROCESSING",
    READY_FOR_PICKUP: "PACKED",
    DRIVER_ASSIGNED: "PACKED",
    PICKED_UP: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
};

// Percent shown on the progress bar — a judgment call, not derived from stored data
const PROGRESS_FOR_STATUS = {
    PENDING: 10,
    ACCEPTED: 20,
    PACKING: 35,
    READY_FOR_PICKUP: 55,
    DRIVER_ASSIGNED: 65,
    PICKED_UP: 80,
    OUT_FOR_DELIVERY: 90,
    DELIVERED: 100,
    CANCELLED: 0,
};

const ACTIVE_STATUSES = [
    "PENDING",
    "ACCEPTED",
    "PACKING",
    "READY_FOR_PICKUP",
    "DRIVER_ASSIGNED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
];
const PAST_STATUSES = ["DELIVERED", "CANCELLED"];

// ─── Helper: shape one Order doc into what the frontend card expects ─────────
// The order only snapshots productName/quantity/price, not an image, so the
// thumbnail is looked up live via productImageMap (built by the callers below).
const toCardShape = (order, productImageMap = {}) => {
    const items = order.products || [];
    const firstItem = items[0];
    const previewItem = firstItem
        ? {
              id: firstItem.productId?.toString() ?? "",
              name: firstItem.productName,
              image: productImageMap[firstItem.productId?.toString()] ?? null,
          }
        : null;

    return {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        placedAt: order.createdAt,
        storeName: order.storeId?.storeName ?? "Store",
        status: STAGE_FOR_STATUS[order.orderStatus] ?? "PROCESSING",
        rawStatus: order.orderStatus, // exposed in case the UI ever needs the precise state
        driverSearchFailed: order.driverSearchFailed ?? false,
        itemSummary: firstItem?.productName ?? "Order items",
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        previewItems: previewItem ? [previewItem] : [],
        progressPercent: PROGRESS_FOR_STATUS[order.orderStatus] ?? 0,
        totalAmount: order.totalAmount,
    };
};

// ─── GET /api/customer/orders?tab=active|past ────────────────────────────────
// Returns the customer's orders, newest first. ?tab filters by status group;
// omit it to get everything.
const getOrders = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);
        const { tab } = req.query;

        const filter = { customerId };
        if (tab === "active") {
            filter.orderStatus = { $in: ACTIVE_STATUSES };
        } else if (tab === "past") {
            filter.orderStatus = { $in: PAST_STATUSES };
        }

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .populate({ path: "storeId", select: "storeName logoUrl" })
            .lean();

        // Batch the image lookups for each order's first item instead of N+1 queries
        const firstProductIds = orders
            .map((o) => o.products?.[0]?.productId)
            .filter(Boolean);
        const products = await Product.find({ _id: { $in: firstProductIds } })
            .select("images")
            .lean();
        const productImageMap = {};
        products.forEach((p) => {
            productImageMap[p._id.toString()] = p.images?.[0] ?? null;
        });

        return res.status(200).json({
            success: true,
            orders: orders.map((o) => toCardShape(o, productImageMap)),
        });
    } catch (err) {
        console.error("GET ORDERS ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── GET /api/customer/orders/:id ─────────────────────────────────────────────
// Full detail for a single order — used by "View Details" / "Track Order".
const getOrderDetail = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, customerId })
            .populate({ path: "storeId", select: "storeName logoUrl address" })
            .lean();

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // driver stays null until delivery assignment is built (see driverId note above)
        const productIds = (order.products || []).map((p) => p.productId);
        const products = await Product.find({ _id: { $in: productIds } })
            .select("images")
            .lean();
        const productImageMap = {};
        products.forEach((p) => {
            productImageMap[p._id.toString()] = p.images?.[0] ?? null;
        });

        return res.status(200).json({
            success: true,
            order: {
                ...toCardShape(order, productImageMap),
                products: order.products,
                deliveryAddress: order.deliveryAddress,
                recipientName: order.recipientName,
                recipientPhone: order.recipientPhone,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                subtotal: order.subtotal,
                deliveryCharge: order.deliveryCharge,
                driver: null,
                store: order.storeId
                    ? { name: order.storeId.storeName, logoUrl: order.storeId.logoUrl, address: order.storeId.address }
                    : null,
            },
        });
    } catch (err) {
        console.error("GET ORDER DETAIL ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Statuses a customer may still self-cancel from — anything up through
// "being packed", but not once the store has marked it ready for pickup
// (a driver search/assignment may already be underway at that point).
const CUSTOMER_CANCELLABLE_STATUSES = ["PENDING", "ACCEPTED", "PACKING"];

// ─── PATCH /api/customer/orders/:id/cancel ───────────────────────────────────
const cancelOrder = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, customerId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "This order can no longer be cancelled — it's already on its way.",
            });
        }

        const previousStatus = order.orderStatus;
        order.orderStatus = "CANCELLED";

        // Two mutually exclusive money-movement paths, depending on whether
        // the order was actually paid for yet:
        let refundAmount = 0; // online/PAID orders: refunded, minus any store-compensation deduction
        let feeCharged = 0;   // COD orders: nothing was ever charged, so compensation is a direct wallet debit instead
        if (order.paymentStatus === "PAID") {
            const deduction = REFUND_DEDUCTION_BY_STATUS[previousStatus] ?? 0;
            refundAmount = Math.max(order.totalAmount - deduction, 0);

            await walletService.creditRefund({
                customerId: order.customerId,
                amount: refundAmount,
                orderId: order._id,
                description: `Refund for cancelled order #${order.orderNumber}`,
            });

            order.paymentStatus = "REFUNDED";
        } else {
            // COD order — never charged, so there's no refund to reduce. If the
            // store had already started packing, the same compensation amount
            // is instead deducted directly from the customer's wallet (clamped
            // to whatever balance they actually have — see debitCancellationFee).
            const deduction = REFUND_DEDUCTION_BY_STATUS[previousStatus] ?? 0;
            if (deduction > 0) {
                feeCharged = await walletService.debitCancellationFee({
                    customerId: order.customerId,
                    amount: deduction,
                    orderId: order._id,
                    description: `Cancellation fee for order #${order.orderNumber} (packing had started)`,
                });
            }
        }

        await order.save();

        // Always let the customer know their cancellation went through — the
        // message itself (built in notificationService) already distinguishes
        // "refunded to wallet" (online payment), "fee deducted" (COD, packing
        // had started), and "nothing to refund" (COD, cancelled before packing).
        CustomerProfile.findById(order.customerId)
            .populate("userId", "_id")
            .lean()
            .then((cp) => {
                if (cp?.userId?._id) {
                    notifyCustomer
                        .cancelled(cp.userId._id, order.orderNumber, order._id, refundAmount, feeCharged)
                        .catch(() => {});
                }
            })
            .catch(() => {});

        // Live update to the customer's own orders page (same event the
        // store-driven status changes use, so useCustomerOrderSocket just works).
        emitToCustomer(customerId, "order:statusChanged", {
            orderId: order._id.toString(),
            orderStatus: "CANCELLED",
            orderNumber: order.orderNumber,
            refundAmount,
        });

        // Live update + notification for the store
        emitToStore(order.storeId, "order:statusChanged", {
            orderId: order._id.toString(),
            orderStatus: "CANCELLED",
        });

        StoreProfile.findById(order.storeId)
            .populate("userId", "_id name email")
            .lean()
            .then((store) => {
                if (!store?.userId?._id) return;
                notifyStore.cancelledByCustomer(store.userId._id, order.orderNumber, order._id).catch(() => {});
                if (store.userId.email) {
                    sendOrderCancelledEmail({
                        toEmail: store.userId.email,
                        name: store.storeName,
                        order,
                    }).catch(() => {});
                }
            })
            .catch(() => {});

        return res.status(200).json({
            success: true,
            message: "Order cancelled.",
            order: toCardShape(order.toObject()),
        });
    } catch (err) {
        console.error("CANCEL ORDER ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── GET /api/customer/orders/active-delivery ───────────────────────────────
// Powers the floating tracking widget — returns the customer's current
// OUT_FOR_DELIVERY order (driver already has it, en route) with everything
// the widget/tracking screen need in one call, or activeDelivery: null if
// nothing is currently out for delivery.
const getActiveDelivery = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);

        const order = await Order.findOne({
            customerId,
            orderStatus: { $in: ["DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
        })
            .sort({ createdAt: -1 })
            .populate("storeId", "storeName coordinates")
            .populate({
                path: "driverId",
                select: "vehicleType vehicleNumber currentLocation userId",
                populate: { path: "userId", select: "name phone" },
            })
            .lean();

        if (!order || !order.driverId) {
            return res.status(200).json({ success: true, activeDelivery: null });
        }

        return res.status(200).json({
            success: true,
            activeDelivery: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                orderStatus: order.orderStatus,
                deliveryAddress: order.deliveryAddress,
                deliveryCoordinates: order.deliveryCoordinates,
                store: {
                    storeName: order.storeId?.storeName ?? "Store",
                    coordinates: order.storeId?.coordinates ?? null,
                },
                driver: {
                    name: order.driverId?.userId?.name ?? "Your delivery partner",
                    phone: order.driverId?.userId?.phone ?? null,
                    vehicleType: order.driverId?.vehicleType ?? null,
                    vehicleNumber: order.driverId?.vehicleNumber ?? null,
                    currentLocation: order.driverId?.currentLocation ?? null,
                },
            },
        });
    } catch (err) {
        console.error("GET ACTIVE DELIVERY ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getOrders,
    getOrderDetail,
    cancelOrder,
    getActiveDelivery,
};