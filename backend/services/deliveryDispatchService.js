const Order = require("../models/shared/order");
const DriverProfile = require("../models/driver/driverProfile");
const StoreProfile = require("../models/store/storeProfile");
const DriverDeliveryRequest = require("../models/driver/driverDeliveryRequest");
const { haversineKm } = require("../utils/distance");
const { emitToDriver } = require("../socket");
const { notifyStore } = require("./notificationService");

// Drivers whose location hasn't updated within this window are treated as offline.
const STALE_LOCATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Time a driver has to Accept/Decline before a delivery request auto-expires.
const REQUEST_EXPIRY_SECONDS = 45;

// Search radius per round — widens as rounds go on so we reach further
// once the immediate area has had its chance.
const RADIUS_KM_BY_ROUND = [5, 8, 12];
const MAX_DISPATCH_ROUNDS = RADIUS_KM_BY_ROUND.length;

// Flat base fare plus a per-km rate covering both legs (driver→store, store→customer).
const BASE_FARE = 15;
const RATE_PER_KM = 6;

const estimateEarnings = (pickupKm, deliveryKm) =>
    Math.round((BASE_FARE + RATE_PER_KM * (pickupKm + deliveryKm)) * 100) / 100;

// Loads an order with the fields dispatch needs, populated with store coords.
const loadOrderForDispatch = (orderId) =>
    Order.findById(orderId)
        .populate({ path: "storeId", select: "storeName address coordinates" })
        .select(
            "orderNumber recipientName deliveryAddress deliveryCoordinates totalAmount paymentMethod products storeId orderStatus driverId deliveryRequestRound driverSearchFailed"
        );

// Driver ids who have already REJECTED this specific order — excluded from
// every later round, since re-showing a declined order just trains drivers
// to decline faster.
const getExcludedDriverIds = async (orderId) => {
    const rejected = await DriverDeliveryRequest.find({ orderId, status: "REJECTED" }).select("driverId").lean();
    return rejected.map((r) => r.driverId.toString());
};

// Emits delivery:request to a set of drivers and creates their request docs.
// Shared by both the round-broadcast path and the single-driver catch-up path.
const createAndEmitRequests = async (order, driverDistancePairs, expiresAt, deliveryDistanceKm) => {
    const requests = await DriverDeliveryRequest.insertMany(
        driverDistancePairs.map(({ driverId, pickupDistanceKm }) => ({
            orderId: order._id,
            driverId,
            status: "PENDING",
            pickupDistanceKm,
            deliveryDistanceKm,
            estimatedEarnings: estimateEarnings(pickupDistanceKm, deliveryDistanceKm),
            expiresAt,
        })),
        { ordered: false }
    );

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

    requests.forEach((r) => {
        emitToDriver(r.driverId, "delivery:request", {
            ...basePayload,
            requestId: r._id.toString(),
            pickupDistanceKm: r.pickupDistanceKm,
            deliveryDistanceKm: r.deliveryDistanceKm,
            estimatedEarnings: r.estimatedEarnings,
            expiresInSeconds: REQUEST_EXPIRY_SECONDS,
        });
    });

    return requests;
};

// ─── Round broadcast ─────────────────────────────────────────────────────────
// Sends this order's next round to nearby ONLINE drivers, excluding anyone
// who already declined it. Radius widens with each round. Call this the
// first time an order becomes READY_FOR_PICKUP (round 1), and again from the
// retry job whenever a round's expiry passes with no acceptance.
// Returns { dispatched: boolean, exhausted: boolean }.
const dispatchRound = async (orderId) => {
    const order = await loadOrderForDispatch(orderId);
    if (!order) {
        console.warn(`[dispatch] Order ${orderId} not found`);
        return { dispatched: false, exhausted: false };
    }

    // Already assigned, cancelled, or already given up on — nothing to do.
    if (order.orderStatus !== "READY_FOR_PICKUP" || order.driverId || order.driverSearchFailed) {
        return { dispatched: false, exhausted: false };
    }

    const nextRound = order.deliveryRequestRound + 1;
    if (nextRound > MAX_DISPATCH_ROUNDS) {
        order.driverSearchFailed = true;
        await order.save();

        StoreProfile.findById(order.storeId._id ?? order.storeId)
            .populate("userId", "_id")
            .lean()
            .then((sp) => {
                if (sp?.userId?._id) {
                    notifyStore.noDriversFound?.(sp.userId._id, order.orderNumber, order._id).catch(() => {});
                }
            })
            .catch(() => {});

        console.warn(`[dispatch] Order ${orderId} exhausted all ${MAX_DISPATCH_ROUNDS} rounds — no driver found`);
        return { dispatched: false, exhausted: true };
    }

    const radiusKm = RADIUS_KM_BY_ROUND[nextRound - 1];

    const storeCoords = order.storeId?.coordinates;
    const hasStoreLocation = storeCoords?.lat && storeCoords?.lng;

    const deliveryCoords = order.deliveryCoordinates;
    const hasDeliveryLocation = deliveryCoords?.lat && deliveryCoords?.lng;

    const deliveryDistanceKm =
        hasStoreLocation && hasDeliveryLocation
            ? Math.round(haversineKm(storeCoords, deliveryCoords) * 10) / 10
            : 0;

    const excludedDriverIds = await getExcludedDriverIds(order._id);

    const cutoff = new Date(Date.now() - STALE_LOCATION_THRESHOLD_MS);
    const onlineDrivers = await DriverProfile.find({
        availabilityStatus: "ONLINE",
        _id: { $nin: excludedDriverIds },
        ...(hasStoreLocation && {
            "currentLocation.lat": { $ne: null },
            "currentLocation.lng": { $ne: null },
            lastLocationUpdate: { $gte: cutoff },
        }),
    }).select("_id currentLocation");

    const nearbyDrivers = hasStoreLocation
        ? onlineDrivers
              .map((d) => {
                  if (!d.currentLocation?.lat || !d.currentLocation?.lng) return null;
                  const pickupDistanceKm = Math.round(haversineKm(storeCoords, d.currentLocation) * 10) / 10;
                  return pickupDistanceKm <= radiusKm ? { driverId: d._id, pickupDistanceKm } : null;
              })
              .filter(Boolean)
        : onlineDrivers.map((d) => ({ driverId: d._id, pickupDistanceKm: 0 }));

    // Bump the round + expiry regardless of whether anyone was found this
    // pass, so the retry job keeps widening instead of retrying the same
    // empty radius forever.
    const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_SECONDS * 1000);
    order.deliveryRequestRound = nextRound;
    order.deliveryRoundExpiresAt = expiresAt;
    await order.save();

    if (!nearbyDrivers.length) {
        console.warn(`[dispatch] Round ${nextRound} for order ${orderId}: no eligible drivers within ${radiusKm}km`);
        return { dispatched: false, exhausted: false };
    }

    await createAndEmitRequests(order, nearbyDrivers, expiresAt, deliveryDistanceKm);
    console.log(`[dispatch] Round ${nextRound} for order ${orderId}: sent to ${nearbyDrivers.length} driver(s) within ${radiusKm}km`);
    return { dispatched: true, exhausted: false };
};

// ─── Catch-up dispatch for a driver who just came online ────────────────────
// A broadcast round only reaches drivers who were online *at that moment*.
// Call this right when a driver flips to ONLINE so they don't have to wait
// for the next retry round to see orders that are already waiting.
const dispatchToOnlineDriver = async (driver) => {
    if (!driver?.currentLocation?.lat || !driver?.currentLocation?.lng) return;

    const alreadyDeclinedOrderIds = await DriverDeliveryRequest.find({
        driverId: driver._id,
        status: { $in: ["REJECTED", "PENDING"] },
    }).select("orderId").lean();
    const excludedOrderIds = alreadyDeclinedOrderIds.map((r) => r.orderId);

    const candidateOrders = await Order.find({
        orderStatus: "READY_FOR_PICKUP",
        driverId: null,
        driverSearchFailed: false,
        _id: { $nin: excludedOrderIds },
    })
        .populate({ path: "storeId", select: "storeName address coordinates" })
        .select(
            "orderNumber recipientName deliveryAddress deliveryCoordinates totalAmount paymentMethod products storeId"
        );

    const widestRadiusKm = RADIUS_KM_BY_ROUND[RADIUS_KM_BY_ROUND.length - 1];

    for (const order of candidateOrders) {
        const storeCoords = order.storeId?.coordinates;
        if (!storeCoords?.lat || !storeCoords?.lng) continue;

        const pickupDistanceKm = Math.round(haversineKm(storeCoords, driver.currentLocation) * 10) / 10;
        if (pickupDistanceKm > widestRadiusKm) continue;

        const deliveryCoords = order.deliveryCoordinates;
        const hasDeliveryLocation = deliveryCoords?.lat && deliveryCoords?.lng;
        const deliveryDistanceKm = hasDeliveryLocation
            ? Math.round(haversineKm(storeCoords, deliveryCoords) * 10) / 10
            : 0;

        const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_SECONDS * 1000);
        await createAndEmitRequests(order, [{ driverId: driver._id, pickupDistanceKm }], expiresAt, deliveryDistanceKm);
        console.log(`[dispatch] Catch-up: order ${order._id} sent to newly-online driver ${driver._id}`);
    }
};

module.exports = {
    dispatchRound,
    dispatchToOnlineDriver,
    MAX_DISPATCH_ROUNDS,
};