const Order = require("../../models/shared/order");
const DriverProfile = require("../../models/driver/driverProfile");
const DriverDeliveryRequest = require("../../models/driver/driverDeliveryRequest");
const CustomerProfile = require("../../models/customer/customerProfile");
const { sendOrderDeliveredEmail } = require("../../services/mailService");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolveDriverProfile = async (req) => {
    const profile = await DriverProfile.findOne({ userId: req.user.userID });
    if (!profile) throw new Error("Driver profile not found");
    return profile;
};

// Shape an order + request into the DeliveryRequest card the frontend renders.
// pickupDistanceKm / deliveryDistanceKm / estimatedEarnings are snapshotted
// on the request at broadcast time (see storeOrdersController's
// broadcastDeliveryRequestToDrivers), so a page refresh shows the same
// numbers the driver saw in the toast — expiresInSeconds is recomputed from
// expiresAt so the countdown ring picks up from the correct remaining time.
const toRequestShape = (order, request) => ({
    requestId: request._id.toString(),
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    storeName: order.storeId?.storeName ?? "Store",
    storeAddress: order.storeId?.address ?? "",
    deliveryAddress: order.deliveryAddress,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    deliveryCharge: order.deliveryCharge,
    itemCount: (order.products || []).reduce((s, i) => s + i.quantity, 0),
    products: order.products || [],
    createdAt: request.createdAt,
    pickupDistanceKm: request.pickupDistanceKm ?? 0,
    deliveryDistanceKm: request.deliveryDistanceKm ?? 0,
    estimatedEarnings: request.estimatedEarnings ?? 0,
    expiresInSeconds: request.expiresAt
        ? Math.max(0, Math.round((new Date(request.expiresAt).getTime() - Date.now()) / 1000))
        : 0,
});

// Shape an order into the ActiveDelivery the frontend tracks
const toActiveShape = (order, currentStage) => ({
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    isPriority: false,
    currentStage: currentStage || orderStatusToStage(order.orderStatus),
    orderStatus: order.orderStatus,
    store: {
        name: order.storeId?.storeName ?? "Store",
        address: order.storeId?.address ?? "",
        logoUrl: order.storeId?.logoUrl ?? null,
        phone: order.storeId?.phone ?? null,
    },
    customer: {
        name: order.recipientName,
        address: order.deliveryAddress,
        phone: order.recipientPhone ?? null,
        deliveryInstruction: order.deliveryInstruction ?? null,
    },
    products: (order.products || []).map((p) => ({
        productId: p.productId?.toString() ?? "",
        productName: p.productName,
        quantity: p.quantity,
        price: p.price,
    })),
    itemCount: (order.products || []).reduce((s, i) => s + i.quantity, 0),
    paymentMethod: order.paymentMethod,
    amountToCollect: order.paymentMethod === "COD" ? order.totalAmount : 0,
    progressSteps: [],
    cashCollected: false,
});
// Mirror the frontend's orderStatusToStage mapping
const orderStatusToStage = (status) => {
    switch (status) {
        case "DRIVER_ASSIGNED": return "NAVIGATE_TO_STORE";
        case "PICKED_UP": return "PICKED_UP";
        case "OUT_FOR_DELIVERY": return "NAVIGATE_TO_CUSTOMER";
        case "DELIVERED": return "DELIVERED";
        default: return "NAVIGATE_TO_STORE";
    }
};

// Map driver stage → order status (only for stages that change order status)
const stageToOrderStatus = (stage) => {
    switch (stage) {
        case "PICKED_UP": return "PICKED_UP";
        case "NAVIGATE_TO_CUSTOMER": return "OUT_FOR_DELIVERY";
        case "DELIVERED": return "DELIVERED";
        default: return null; // REACHED_STORE / REACHED_CUSTOMER don't change order status
    }
};

// ─── GET /api/driver/deliveries/requests ─────────────────────────────────────
// Returns all PENDING delivery requests for this driver that haven't expired.
const getDeliveryRequests = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        const requests = await DriverDeliveryRequest.find({
            driverId: driver._id,
            status: "PENDING",
        })
            .sort({ createdAt: -1 })
            .lean();

        if (!requests.length) {
            return res.status(200).json({ success: true, requests: [] });
        }

        const orderIds = requests.map((r) => r.orderId);
        const orders = await Order.find({ _id: { $in: orderIds } })
            .populate({ path: "storeId", select: "storeName address logoUrl phone" })
            .lean();

        const orderMap = {};
        orders.forEach((o) => { orderMap[o._id.toString()] = o; });

        const shaped = requests
            .map((r) => {
                const order = orderMap[r.orderId.toString()];
                return order ? toRequestShape(order, r) : null;
            })
            .filter(Boolean);

        return res.status(200).json({ success: true, requests: shaped });
    } catch (err) {
        console.error("[getDeliveryRequests]", err);
        return res.status(500).json({ success: false, message: "Failed to load delivery requests." });
    }
};

const acceptDeliveryRequest = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { requestId } = req.params;

        // Verify this request belongs to this driver and is still pending
        const request = await DriverDeliveryRequest.findOne({
            _id: requestId,
            driverId: driver._id,
            status: "PENDING",
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "This order is no longer available.",
            });
        }

        // ── Atomic assignment — only succeeds if no driver is assigned yet
        //    AND the order is still READY_FOR_PICKUP. This is the single
        //    source of truth for the race condition: even if two drivers
        //    hit Accept at the exact same millisecond, only one write wins.
        const order = await Order.findOneAndUpdate(
            {
                _id: request.orderId,
                orderStatus: "READY_FOR_PICKUP",
                driverId: null,
            },
            {
                $set: {
                    driverId: driver._id,
                    orderStatus: "DRIVER_ASSIGNED",
                },
            },
            { new: true }
        ).populate({ path: "storeId", select: "storeName address" });

        if (!order) {
            // Another driver won the race — expire this driver's request
            await DriverDeliveryRequest.findByIdAndUpdate(requestId, { status: "EXPIRED" });
            return res.status(409).json({
                success: false,
                message: "This order was just picked up by another driver.",
            });
        }

        // Mark this driver's request as ACCEPTED
        await DriverDeliveryRequest.findByIdAndUpdate(requestId, { status: "ACCEPTED" });

        // Expire all other drivers' pending requests for this order
        // and collect their IDs so we can notify them via socket
        const otherRequests = await DriverDeliveryRequest.find({
            orderId: order._id,
            _id: { $ne: requestId },
            status: "PENDING",
        }).select("driverId");

        if (otherRequests.length) {
            await DriverDeliveryRequest.updateMany(
                { orderId: order._id, _id: { $ne: requestId }, status: "PENDING" },
                { status: "EXPIRED" }
            );

            // Tell other drivers their request is gone — card disappears instantly
            const { emitToDriver } = require("../../socket");
            otherRequests.forEach((r) => {
                emitToDriver(r.driverId, "delivery:request:taken", {
                    orderId: order._id.toString(),
                    requestId: requestId,
                    message: "This order was picked up by another driver.",
                });
            });
        }

        // Mark driver as BUSY
        driver.availabilityStatus = "BUSY";
        await driver.save();

        // Notify the store
        const { emitToStore } = require("../../socket");
        emitToStore(order.storeId._id ?? order.storeId, "order:statusChanged", {
            orderId: order._id.toString(),
            orderStatus: "DRIVER_ASSIGNED",
        });

        return res.status(200).json({
            success: true,
            activeDelivery: toActiveShape(order, "NAVIGATE_TO_STORE"),
        });
    } catch (err) {
        console.error("[acceptDeliveryRequest]", err);
        return res.status(500).json({ success: false, message: "Failed to accept delivery request." });
    }
};

// ─── POST /api/driver/deliveries/requests/:requestId/decline ─────────────────
const declineDeliveryRequest = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { requestId } = req.params;

        const updated = await DriverDeliveryRequest.findOneAndUpdate(
            { _id: requestId, driverId: driver._id, status: "PENDING" },
            { status: "REJECTED" }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Request not found or already handled." });
        }

        return res.status(200).json({ success: true, message: "Request declined." });
    } catch (err) {
        console.error("[declineDeliveryRequest]", err);
        return res.status(500).json({ success: false, message: "Failed to decline delivery request." });
    }
};

// ─── GET /api/driver/deliveries/active ───────────────────────────────────────
const getActiveDelivery = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        const order = await Order.findOne({
            driverId: driver._id,
            orderStatus: { $in: ["DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
        })
            .populate({ path: "storeId", select: "storeName address" })
            .lean();

        return res.status(200).json({
            success: true,
            activeDelivery: order ? toActiveShape(order) : null,
        });
    } catch (err) {
        console.error("[getActiveDelivery]", err);
        return res.status(500).json({ success: false, message: "Failed to load active delivery." });
    }
};

// ─── PATCH /api/driver/deliveries/:orderId/stage ──────────────────────────────
// Driver advances through: NAVIGATE_TO_STORE → REACHED_STORE → PICKED_UP
//                          → NAVIGATE_TO_CUSTOMER → REACHED_CUSTOMER → DELIVERED
const advanceDeliveryStage = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { orderId } = req.params;
        const { stage } = req.body;

        if (!stage) {
            return res.status(400).json({ success: false, message: "stage is required." });
        }

        const order = await Order.findOne({ _id: orderId, driverId: driver._id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Map the new driver stage to an order status (if applicable)
        const newOrderStatus = stageToOrderStatus(stage);
        if (newOrderStatus) {
            order.orderStatus = newOrderStatus;
        }

        let completedAt = null;
        if (stage === "DELIVERED") {
            completedAt = new Date().toISOString();
            // Increment driver stats
            driver.totalDeliveries += 1;
            driver.availabilityStatus = "ONLINE";
            await driver.save();
        }

        await order.save();

        // ── Send delivered/thank-you email to the customer ─────────────────────
        if (stage === "DELIVERED") {
            CustomerProfile.findById(order.customerId)
                .populate("userId", "name email")
                .lean()
                .then((customerProfile) => {
                    if (customerProfile?.userId?.email) {
                        sendOrderDeliveredEmail({
                            toEmail: customerProfile.userId.email,
                            customerName: customerProfile.userId.name,
                            order,
                        }).catch(() => {});
                    }
                })
                .catch((err) => console.error("[order delivered email] Failed:", err));
        }

        return res.status(200).json({
            success: true,
            currentStage: stage,
            completedAt,
        });
    } catch (err) {
        console.error("[advanceDeliveryStage]", err);
        return res.status(500).json({ success: false, message: "Failed to update delivery stage." });
    }
};

// ─── POST /api/driver/deliveries/:orderId/cash-collected ──────────────────────
const confirmCashCollected = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { orderId } = req.params;

        const order = await Order.findOne({ _id: orderId, driverId: driver._id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (order.paymentMethod !== "COD") {
            return res.status(400).json({ success: false, message: "Order is not a COD order." });
        }

        // Track cash on the driver's profile for settlement later
        driver.cashCollected += order.totalAmount;
        driver.cashPendingSettlement += order.totalAmount;
        await driver.save();

        // Mark payment as paid
        order.paymentStatus = "PAID";
        await order.save();

        return res.status(200).json({ success: true, message: "Cash collection confirmed." });
    } catch (err) {
        console.error("[confirmCashCollected]", err);
        return res.status(500).json({ success: false, message: "Failed to confirm cash collection." });
    }
};

// ─── GET /api/driver/deliveries/completed ────────────────────────────────────
const getCompletedDeliveries = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({ driverId: driver._id, orderStatus: "DELIVERED" })
                .populate({ path: "storeId", select: "storeName logoUrl" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ driverId: driver._id, orderStatus: "DELIVERED" }),
        ]);

        const deliveries = orders.map((o) => ({
            orderId: o._id.toString(),
            orderNumber: o.orderNumber,
            storeName: o.storeId?.storeName ?? "Store",
            storeLogoUrl: o.storeId?.logoUrl ?? null,
            customerName: o.recipientName,
            deliveryAddress: o.deliveryAddress,
            totalAmount: o.totalAmount,
            paymentMethod: o.paymentMethod,
            itemCount: (o.products || []).reduce((s, i) => s + i.quantity, 0),
            completedAt: o.createdAt,
            earnings: o.deliveryCharge ?? 0,
        }));

        return res.status(200).json({
            success: true,
            deliveries,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error("[getCompletedDeliveries]", err);
        return res.status(500).json({ success: false, message: "Failed to load delivery history." });
    }
};

// ─── GET /api/driver/deliveries/stats/today ───────────────────────────────────
const getTodayStats = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Yesterday for earnings comparison
        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const [todayOrders, yesterdayOrders] = await Promise.all([
            Order.find({
                driverId: driver._id,
                orderStatus: "DELIVERED",
                createdAt: { $gte: startOfDay },
            }).lean(),
            Order.find({
                driverId: driver._id,
                orderStatus: "DELIVERED",
                createdAt: { $gte: startOfYesterday, $lt: startOfDay },
            }).lean(),
        ]);

        const todayEarnings = todayOrders.reduce((s, o) => s + (o.deliveryCharge || 0), 0);
        const yesterdayEarnings = yesterdayOrders.reduce((s, o) => s + (o.deliveryCharge || 0), 0);

        const earningsChangePercent = yesterdayEarnings > 0
            ? Math.round(((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100)
            : 0;

        // Daily target — hardcode or pull from config
        const dailyTarget = 15;
        const targetBonus = 200;

        return res.status(200).json({
            success: true,
            stats: {
                todayEarnings,
                completedCount: todayOrders.length,
                currentCount: todayOrders.length,
                dailyTarget,
                targetBonus,
                earningsChangePercent,
                cashCollected: todayOrders
                    .filter((o) => o.paymentMethod === "COD")
                    .reduce((s, o) => s + o.totalAmount, 0),
                totalDeliveries: driver.totalDeliveries,
            },
        });
    } catch (err) {
        console.error("[getTodayStats]", err);
        return res.status(500).json({ success: false, message: "Failed to load stats." });
    }
};

// ─── PATCH /api/driver/availability ──────────────────────────────────────────
const updateAvailability = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const { status } = req.body; // "ONLINE" | "OFFLINE"

        if (!["ONLINE", "OFFLINE"].includes(status)) {
            return res.status(400).json({ success: false, message: "status must be ONLINE or OFFLINE." });
        }

        // Don't let the driver go offline mid-delivery
        if (status === "OFFLINE" && driver.availabilityStatus === "BUSY") {
            return res.status(409).json({
                success: false,
                message: "Cannot go offline while you have an active delivery.",
            });
        }

        driver.availabilityStatus = status;
        await driver.save();

        return res.status(200).json({ success: true, status: driver.availabilityStatus });
    } catch (err) {
        console.error("[updateAvailability]", err);
        return res.status(500).json({ success: false, message: "Failed to update availability." });
    }
};

module.exports = {
    getDeliveryRequests,
    acceptDeliveryRequest,
    declineDeliveryRequest,
    getActiveDelivery,
    advanceDeliveryStage,
    confirmCashCollected,
    getCompletedDeliveries,
    getTodayStats,
    updateAvailability,
};