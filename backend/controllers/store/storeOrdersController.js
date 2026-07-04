const Order = require("../../models/shared/order");
const DriverProfile = require("../../models/driver/driverProfile");
const CustomerProfile = require("../../models/customer/customerProfile");
const StoreProfile = require("../../models/store/storeProfile");
const { haversineKm } = require("../../utils/distance");
const DriverDeliveryRequest = require("../../models/driver/driverDeliveryRequest");
const { resolveStoreProfile } = require("../../services/storeProfileService");
const { sendOrderCancelledEmail } = require("../../services/mailService");

const resolveStoreId = async (req) => {
    const store = await resolveStoreProfile(req.user.userID);
    return store._id;
};

const ALLOWED_TRANSITIONS = {
    PENDING: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["PACKING"],
    PACKING: ["READY_FOR_PICKUP"],
    READY_FOR_PICKUP: [],
};

const TAB_STATUS_MAP = {
    PENDING: ["PENDING"],
    ACCEPTED: ["ACCEPTED"],
    READY: ["READY_FOR_PICKUP"],
    ALL: [
        "PENDING", "ACCEPTED", "PACKING", "READY_FOR_PICKUP",
        "DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY",
        "DELIVERED", "CANCELLED",
    ],
};

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
    itemCount: (order.products || []).reduce((sum, i) => sum + i.quantity, 0),
    subtotal: order.subtotal,
    deliveryCharge: order.deliveryCharge,
    totalAmount: order.totalAmount,
    products: order.products || [],
});

const setNoCacheHeaders = (res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store",
    });
};

const DELIVERY_RADIUS_KM = 5;
// Drivers whose lastLocationUpdate is older than this are treated as offline —
// they lost connection without going offline properly.
const STALE_LOCATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes — accounts for backgrounded tabs

// How long a driver has to Accept/Decline before the request auto-expires.
// Mirrors the countdown ring shown on the frontend's request card.
const REQUEST_EXPIRY_SECONDS = 45;

// Flat base fare plus a per-km rate covering both legs (driver→store, store→customer)
const BASE_FARE = 15;
const RATE_PER_KM = 6;
const estimateEarnings = (pickupKm, deliveryKm) =>
    Math.round((BASE_FARE + RATE_PER_KM * (pickupKm + deliveryKm)) * 100) / 100;

const broadcastDeliveryRequestToDrivers = async (orderId) => {
    const { emitToDriver } = require("../../socket");

    // Fetch the order + its store's coordinates so we can filter by distance
    const order = await Order.findById(orderId)
        .populate({ path: "storeId", select: "storeName address coordinates" })
        .select(
            "orderNumber recipientName deliveryAddress deliveryCoordinates totalAmount paymentMethod products storeId"
        );

    if (!order) {
        console.warn(`[broadcastDelivery] Order ${orderId} not found`);
        return;
    }

    const storeCoords = order.storeId?.coordinates;
    const hasStoreLocation = storeCoords?.lat && storeCoords?.lng;

    const deliveryCoords = order.deliveryCoordinates;
    const hasDeliveryLocation = deliveryCoords?.lat && deliveryCoords?.lng;

    // Store → customer leg is the same for every driver, so compute it once.
    const deliveryDistanceKm =
        hasStoreLocation && hasDeliveryLocation
            ? Math.round(haversineKm(storeCoords, deliveryCoords) * 10) / 10
            : 0;

    // Find all ONLINE drivers with a fresh location update
    const cutoff = new Date(Date.now() - STALE_LOCATION_THRESHOLD_MS);
    const onlineDrivers = await DriverProfile.find({
        availabilityStatus: "ONLINE",
        ...(hasStoreLocation && {
            "currentLocation.lat": { $ne: null },
            "currentLocation.lng": { $ne: null },
            lastLocationUpdate: { $gte: cutoff },
        }),
    }).select("_id currentLocation");

    // Filter by radius if the store has coordinates, keeping each driver's
    // pickup-leg distance so we don't have to recompute it later.
    const nearbyDrivers = hasStoreLocation
        ? onlineDrivers
              .map((d) => {
                  if (!d.currentLocation?.lat || !d.currentLocation?.lng) return null;
                  const pickupDistanceKm =
                      Math.round(haversineKm(storeCoords, d.currentLocation) * 10) / 10;
                  return pickupDistanceKm <= DELIVERY_RADIUS_KM ? { driver: d, pickupDistanceKm } : null;
              })
              .filter(Boolean)
        : onlineDrivers.map((d) => ({ driver: d, pickupDistanceKm: 0 })); // fallback: no store location yet

    if (!nearbyDrivers.length) {
        console.warn(`[broadcastDelivery] No nearby online drivers for order ${orderId}`);
        return;
    }

    const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_SECONDS * 1000);

    // Create one DriverDeliveryRequest per nearby driver, snapshotting the
    // distances/earnings/expiry so they stay consistent on refresh later.
    const requests = await DriverDeliveryRequest.insertMany(
        nearbyDrivers.map(({ driver, pickupDistanceKm }) => ({
            orderId,
            driverId: driver._id,
            status: "PENDING",
            pickupDistanceKm,
            deliveryDistanceKm,
            estimatedEarnings: estimateEarnings(pickupDistanceKm, deliveryDistanceKm),
            expiresAt,
        })),
        { ordered: false }
    );

    // Map driverId → request doc so each driver gets their own requestId + numbers
    const driverToRequest = {};
    requests.forEach((r) => {
        driverToRequest[r.driverId.toString()] = r;
    });

    const basePayload = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        recipientName: order.recipientName,
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        itemCount: (order.products || []).reduce((s, i) => s + i.quantity, 0),
        storeName: order.storeId?.storeName ?? "Store",
        storeAddress: order.storeId?.address ?? "",
    };

    nearbyDrivers.forEach(({ driver }) => {
        const request = driverToRequest[driver._id.toString()];
        if (!request) return;

        emitToDriver(driver._id, "delivery:request", {
            ...basePayload,
            requestId: request._id.toString(),
            pickupDistanceKm: request.pickupDistanceKm,
            deliveryDistanceKm: request.deliveryDistanceKm,
            estimatedEarnings: request.estimatedEarnings,
            expiresInSeconds: REQUEST_EXPIRY_SECONDS,
        });
    });

    console.log(`[broadcastDelivery] Sent to ${nearbyDrivers.length} nearby driver(s) for order ${orderId}`);
};

// ─── GET /api/store/orders ────────────────────────────────────────────────────
const getStoreOrders = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        const tab = req.query.tab || "ALL";
        const search = req.query.search || "";
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const statusList = TAB_STATUS_MAP[tab] ?? TAB_STATUS_MAP.ALL;
        const filter = { storeId, orderStatus: { $in: statusList } };

        if (search.trim()) {
            filter.$or = [
                { orderNumber: { $regex: search.trim(), $options: "i" } },
                { recipientName: { $regex: search.trim(), $options: "i" } },
                { recipientPhone: { $regex: search.trim(), $options: "i" } },
            ];
        }

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ]);

        setNoCacheHeaders(res);

        return res.status(200).json({
            success: true,
            orders: orders.map(toListShape),
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error("GET STORE ORDERS ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── GET /api/store/orders/:id ────────────────────────────────────────────────
const getStoreOrderDetail = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, storeId }).lean();
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        setNoCacheHeaders(res);
        return res.status(200).json({ success: true, order: toListShape(order) });
    } catch (err) {
        console.error("GET STORE ORDER DETAIL ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── PATCH /api/store/orders/:id/status ──────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }

        const order = await Order.findOne({ _id: id, storeId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
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

        // When ready for pickup, broadcast to all online drivers (fire-and-forget)
        if (status === "READY_FOR_PICKUP") {
            broadcastDeliveryRequestToDrivers(order._id).catch((err) =>
                console.error("[broadcastDelivery] Failed:", err)
            );
        }

        // When cancelled, notify customer, store, and driver (if assigned)
        if (status === "CANCELLED") {
            Promise.all([
                CustomerProfile.findById(order.customerId).populate("userId", "name email").lean(),
                StoreProfile.findById(order.storeId).populate("userId", "name email").lean(),
                order.driverId
                    ? DriverProfile.findById(order.driverId).populate("userId", "name email").lean()
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
                .catch((err) => console.error("[order cancelled emails] Failed:", err));
        }

        setNoCacheHeaders(res);

        return res.status(200).json({
            success: true,
            message: `Order status updated to ${status}.`,
            order: toListShape(order.toObject()),
        });
    } catch (err) {
        console.error("UPDATE ORDER STATUS ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = { getStoreOrders, getStoreOrderDetail, updateOrderStatus };