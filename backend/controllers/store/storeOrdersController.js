const Order = require("../../models/shared/order");
const DriverProfile = require("../../models/driver/driverProfile");
const CustomerProfile = require("../../models/customer/customerProfile");
const StoreProfile = require("../../models/store/storeProfile");
const { resolveStoreProfile } = require("../../services/storeProfileService");
const { sendOrderCancelledEmail } = require("../../services/mailService");
const { emitToCustomer } = require("../../socket");
const { notifyCustomer } = require("../../services/notificationService");
const { dispatchRound } = require("../../services/deliveryDispatchService");
const walletService = require("../../services/walletService");

/**
 * Returns the StoreProfile ID of the authenticated store user.
 */
const resolveStoreId = async (req) => {
    const store = await resolveStoreProfile(req.user.userID);
    return store._id;
};

/**
 * Defines the valid order status transitions
 * that a store is allowed to perform.
 */
const ALLOWED_TRANSITIONS = {
    PENDING: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["PACKING"],
    PACKING: ["READY_FOR_PICKUP"],
    READY_FOR_PICKUP: [],
};

/**
 * Maps dashboard tabs to the
 * corresponding order statuses.
 */
const TAB_STATUS_MAP = {
    PENDING: ["PENDING"],
    ACCEPTED: ["ACCEPTED"],
    READY: ["READY_FOR_PICKUP"],
    ALL: [
        "PENDING",
        "ACCEPTED",
        "PACKING",
        "READY_FOR_PICKUP",
        "DRIVER_ASSIGNED",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
    ],
};

/**
 * Converts an Order document into
 * the API response format.
 */
const toListShape = (order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    placedAt: order.createdAt,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    driverSearchFailed: order.driverSearchFailed ?? false,
    itemCount: (order.products || []).reduce((sum, item) => sum + item.quantity, 0),
    subtotal: order.subtotal,
    deliveryCharge: order.deliveryCharge,
    totalAmount: order.totalAmount,
    products: order.products || [],
});

/**
 * Prevents browsers from caching
 * order-related API responses.
 */
const setNoCacheHeaders = (res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
    });
};

// ─────────────────────────────────────────────────────────────
// GET /api/store/orders
// Returns paginated orders for the logged-in store.
// ─────────────────────────────────────────────────────────────
const getStoreOrders = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        const tab = req.query.tab || "ALL";
        const search = req.query.search || "";
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const statusList = TAB_STATUS_MAP[tab] ?? TAB_STATUS_MAP.ALL;
        const filter = {
            storeId,
            orderStatus: { $in: statusList },
        };

        // Search by order number, recipient name or phone.
        if (search.trim()) {
            filter.$or = [
                {
                    orderNumber: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    recipientName: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    recipientPhone: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ]);

        setNoCacheHeaders(res);

        return res.status(200).json({
            success: true,
            orders: orders.map(toListShape),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error("GET STORE ORDERS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/store/orders/:id
// Returns a single order belonging to the store.
// ─────────────────────────────────────────────────────────────
const getStoreOrderDetail = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);
        const { id } = req.params;

        const order = await Order.findOne({
            _id: id,
            storeId,
        }).lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        setNoCacheHeaders(res);

        return res.status(200).json({
            success: true,
            order: toListShape(order),
        });
    } catch (err) {
        console.error("GET STORE ORDER DETAIL ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/store/orders/:id/status
// Updates order status and triggers related actions.
// ─────────────────────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required.",
            });
        }

        const order = await Order.findOne({
            _id: id,
            storeId,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        const allowed = ALLOWED_TRANSITIONS[order.orderStatus] ?? [];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${order.orderStatus} to ${status}.`,
            });
        }

        order.orderStatus = status;
        await order.save();

        /**
         * Notify the customer in real time
         * and store a persistent notification.
         */
        CustomerProfile.findById(order.customerId)
            .populate("userId", "_id name")
            .lean()
            .then(async (cp) => {
                if (!cp) return;

                emitToCustomer(cp._id, "order:statusChanged", {
                    orderId: order._id.toString(),
                    orderStatus: status,
                    orderNumber: order.orderNumber,
                });

                const uid = cp.userId?._id;
                if (!uid) return;

                if (status === "ACCEPTED") {
                    const store = await StoreProfile.findById(order.storeId)
                        .select("storeName")
                        .lean();

                    notifyCustomer.accepted(
                        uid,
                        order.orderNumber,
                        store?.storeName ?? "The store",
                        order._id
                    ).catch(() => {});
                } else if (status === "PACKING") {
                    notifyCustomer.packing(
                        uid,
                        order.orderNumber,
                        order._id
                    ).catch(() => {});
                } else if (status === "READY_FOR_PICKUP") {
                    notifyCustomer.searchingDriver(
                        uid,
                        order.orderNumber,
                        order._id
                    ).catch(() => {});
                } else if (status === "CANCELLED") {
                    notifyCustomer.cancelled(
                        uid,
                        order.orderNumber,
                        order._id
                    ).catch(() => {});
                }
            })
            .catch(() => {});

        /**
         * Broadcasts the order to nearby drivers.
         * Additional rounds are handled by the retry job.
         */
        if (status === "READY_FOR_PICKUP") {
            dispatchRound(order._id).catch((err) =>
                console.error("[dispatchRound] Failed:", err)
            );
        }

        /**
         * Sends cancellation emails to customer,
         * store, and assigned driver.
         */
        if (status === "CANCELLED") {
            Promise.all([
                CustomerProfile.findById(order.customerId)
                    .populate("userId", "name email")
                    .lean(),

                StoreProfile.findById(order.storeId)
                    .populate("userId", "name email")
                    .lean(),

                order.driverId
                    ? DriverProfile.findById(order.driverId)
                          .populate("userId", "name email")
                          .lean()
                    : null,
            ])
                .then(([customerProfile, storeProfile, driverProfile]) => {
                    if (customerProfile?.userId?.email) {
                        sendOrderCancelledEmail({
                            toEmail: customerProfile.userId.email,
                            name: customerProfile.userId.name,
                            order,
                        }).catch(() => {});
                    }

                    if (storeProfile?.userId?.email) {
                        sendOrderCancelledEmail({
                            toEmail: storeProfile.userId.email,
                            name: storeProfile.storeName,
                            order,
                        }).catch(() => {});
                    }

                    if (driverProfile?.userId?.email) {
                        sendOrderCancelledEmail({
                            toEmail: driverProfile.userId.email,
                            name: driverProfile.userId.name,
                            order,
                        }).catch(() => {});
                    }
                })
                .catch((err) =>
                    console.error("[Order Cancellation Email] Failed:", err)
                );
        }

        setNoCacheHeaders(res);

        return res.status(200).json({
            success: true,
            message: `Order status updated to ${status}.`,
            order: toListShape(order.toObject()),
        });
    } catch (err) {
        console.error("UPDATE ORDER STATUS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/store/orders/:id/retry-dispatch
// Resets a failed driver search and kicks off a fresh round of
// dispatch rounds. Only valid for orders the search already gave
// up on (driverSearchFailed === true) — this is the only path
// that can un-stick them, since READY_FOR_PICKUP otherwise has
// no allowed transitions and the retry cron ignores failed orders.
// ─────────────────────────────────────────────────────────────
const retryDriverSearch = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, storeId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        if (order.orderStatus !== "READY_FOR_PICKUP" || !order.driverSearchFailed) {
            return res.status(400).json({
                success: false,
                message: "This order isn't in a failed driver search state.",
            });
        }

        order.driverSearchFailed = false;
        order.deliveryRequestRound = 0;
        order.deliveryRoundExpiresAt = null;
        await order.save();

        emitToCustomer(order.customerId, "order:driverSearchFailed", {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            failed: false,
        });

        dispatchRound(order._id).catch((err) =>
            console.error("[retryDriverSearch] dispatchRound failed:", err)
        );

        CustomerProfile.findById(order.customerId)
            .populate("userId", "_id")
            .lean()
            .then((cp) => {
                if (cp?.userId?._id) {
                    notifyCustomer.searchingDriver(
                        cp.userId._id,
                        order.orderNumber,
                        order._id
                    ).catch(() => {});
                }
            })
            .catch(() => {});

        setNoCacheHeaders(res);

        return res.status(200).json({
            success: true,
            message: "Retrying driver search.",
            order: toListShape(order.toObject()),
        });
    } catch (err) {
        console.error("RETRY DRIVER SEARCH ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/store/orders/:id/cancel-undeliverable
// Cancels an order that never found a driver, with a full refund
// (no store-compensation deduction — this is a platform failure,
// not something the customer or store caused, unlike the
// self-cancel flow in customer/ordersController.js).
// ─────────────────────────────────────────────────────────────
const cancelUndeliverableOrder = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, storeId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        if (order.orderStatus !== "READY_FOR_PICKUP" || !order.driverSearchFailed) {
            return res.status(400).json({
                success: false,
                message: "This order can only be cancelled this way after a failed driver search.",
            });
        }

        let refundAmount = 0;
        if (order.paymentStatus === "PAID") {
            refundAmount = order.totalAmount;

            await walletService.creditRefund({
                customerId: order.customerId,
                amount: refundAmount,
                orderId: order._id,
                description: `Refund for order #${order.orderNumber} — no driver was available`,
            });

            order.paymentStatus = "REFUNDED";
        }

        order.orderStatus = "CANCELLED";
        await order.save();

        emitToCustomer(order.customerId, "order:statusChanged", {
            orderId: order._id.toString(),
            orderStatus: "CANCELLED",
            orderNumber: order.orderNumber,
            refundAmount,
        });

        CustomerProfile.findById(order.customerId)
            .populate("userId", "_id name email")
            .lean()
            .then((cp) => {
                if (!cp?.userId?._id) return;

                notifyCustomer.cancelledNoDriver(
                    cp.userId._id,
                    order.orderNumber,
                    order._id,
                    refundAmount
                ).catch(() => {});

                if (cp.userId.email) {
                    sendOrderCancelledEmail({
                        toEmail: cp.userId.email,
                        name: cp.userId.name,
                        order,
                    }).catch(() => {});
                }
            })
            .catch(() => {});

        setNoCacheHeaders(res);

        return res.status(200).json({
            success: true,
            message: "Order cancelled and refunded.",
            order: toListShape(order.toObject()),
        });
    } catch (err) {
        console.error("CANCEL UNDELIVERABLE ORDER ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

module.exports = {
    getStoreOrders,
    getStoreOrderDetail,
    updateOrderStatus,
    retryDriverSearch,
    cancelUndeliverableOrder,
};