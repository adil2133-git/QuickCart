const Order = require("../models/shared/order");
const DriverProfile = require("../models/driver/driverProfile");
const StoreProfile = require("../models/store/storeProfile");
const CustomerProfile = require("../models/customer/customerProfile");
const DriverDeliveryRequest = require("../models/driver/driverDeliveryRequest");

const { haversineKm } = require("../utils/distance");
const { emitToDriver, emitToCustomer } = require("../socket");
const { notifyStore, notifyCustomer } = require("./notificationService");
const { isEligibleForOrder } = require("./driverWalletService");

// COD-restriction-aware companion to the plain availabilityStatus filter —
// WARNING-tier drivers stay eligible for prepaid orders but not COD ones;
// RESTRICTED/SUSPENDED drivers are excluded from the base query entirely.
const codRestrictionFilterFor = (paymentMethod) =>
    paymentMethod === "COD"
        ? { codRestrictionStatus: "NORMAL" }
        : { codRestrictionStatus: { $in: ["NORMAL", "WARNING"] } };

// driver location older than this is treated as stale
const STALE_LOCATION_THRESHOLD_MS = 5 * 60 * 1000;

// time a driver gets to accept/reject a request
const REQUEST_EXPIRY_SECONDS = 30;

// radius grows with each round
const RADIUS_KM_BY_ROUND = [5, 8, 10];
const MAX_DISPATCH_ROUNDS = RADIUS_KM_BY_ROUND.length;

// after normal rounds are exhausted, retry at max radius a couple more times
const FALLBACK_COOLDOWN_MS = 2 * 60 * 1000;
const FALLBACK_ATTEMPTS = 2;
const TOTAL_DISPATCH_ROUNDS = MAX_DISPATCH_ROUNDS + FALLBACK_ATTEMPTS;

const BASE_FARE = 15;
const RATE_PER_KM = 6;

const estimateEarnings = (pickupKm, deliveryKm) =>
    Math.round((BASE_FARE + RATE_PER_KM * (pickupKm + deliveryKm)) * 100) / 100;

const loadOrderForDispatch = (orderId) =>
    Order.findById(orderId)
        .populate({
            path: "storeId",
            select: "storeName address coordinates",
        })
        .select(
            "orderNumber recipientName deliveryAddress deliveryCoordinates totalAmount paymentMethod products storeId customerId orderStatus driverId deliveryRequestRound driverSearchFailed"
        );

const getExcludedDriverIds = async (orderId) => {
    const rejected = await DriverDeliveryRequest.find({
        orderId,
        status: "REJECTED",
    })
        .select("driverId")
        .lean();

    return rejected.map((r) => r.driverId.toString());
};

// creates the request docs for this round and pushes them to drivers over socket
const createAndEmitRequests = async (
    order,
    driverDistancePairs,
    expiresAt,
    deliveryDistanceKm
) => {
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
        itemCount: (order.products || []).reduce((sum, item) => sum + item.quantity, 0),
        storeName: order.storeId?.storeName ?? "Store",
        storeAddress: order.storeId?.address ?? "",
    };

    requests.forEach((request) => {
        emitToDriver(request.driverId, "delivery:request", {
            ...basePayload,
            requestId: request._id.toString(),
            pickupDistanceKm: request.pickupDistanceKm,
            deliveryDistanceKm: request.deliveryDistanceKm,
            estimatedEarnings: request.estimatedEarnings,
            expiresInSeconds: REQUEST_EXPIRY_SECONDS,
        });
    });

    return requests;
};

// gives up on finding a driver and notifies both the store and the customer
const markSearchFailed = async (order, logMessage) => {
    order.driverSearchFailed = true;
    await order.save();

    if (logMessage) console.warn(logMessage);

    emitToCustomer(order.customerId, "order:driverSearchFailed", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        failed: true,
    });

    StoreProfile.findById(order.storeId._id ?? order.storeId)
        .populate("userId", "_id")
        .lean()
        .then((store) => {
            if (store?.userId?._id) {
                notifyStore.noDriversFound?.(
                    store.userId._id,
                    order.orderNumber,
                    order._id
                ).catch(() => {});
            }
        })
        .catch(() => {});

    CustomerProfile.findById(order.customerId)
        .populate("userId", "_id")
        .lean()
        .then((cp) => {
            if (cp?.userId?._id) {
                notifyCustomer.noDriversFound?.(
                    cp.userId._id,
                    order.orderNumber,
                    order._id
                ).catch(() => {});
            }
        })
        .catch(() => {});
};

// runs one round of the driver search for an order
const dispatchRound = async (orderId) => {
    const order = await loadOrderForDispatch(orderId);

    if (!order) {
        console.warn(`[dispatch] Order ${orderId} not found`);
        return { dispatched: false, exhausted: false };
    }

    // order might have already got a driver or failed between scheduling and running
    if (
        order.orderStatus !== "READY_FOR_PICKUP" ||
        order.driverId ||
        order.driverSearchFailed
    ) {
        return { dispatched: false, exhausted: false };
    }

    const nextRound = order.deliveryRequestRound + 1;
    const isFallbackRound = nextRound > MAX_DISPATCH_ROUNDS;

    if (nextRound > TOTAL_DISPATCH_ROUNDS) {
        await markSearchFailed(
            order,
            `[dispatch] Order ${orderId} exhausted all ${MAX_DISPATCH_ROUNDS} rounds + ${FALLBACK_ATTEMPTS} fallback attempts — no driver found`
        );

        return { dispatched: false, exhausted: true };
    }

    // if nobody is online at all, widening the radius won't help — fail fast
    const onlineDriverCount = await DriverProfile.countDocuments({
        availabilityStatus: "ONLINE",
    });

    if (onlineDriverCount === 0) {
        await markSearchFailed(
            order,
            `[dispatch] Order ${orderId}: no online drivers at all — failing search early instead of waiting out remaining rounds`
        );

        return { dispatched: false, exhausted: true };
    }

    // only fail-fast on the fallback phase, not the normal rounds — a driver
    // could still log on any second during the real rounds, and we don't
    // want to give up on them early
    if (isFallbackRound) {
        const onlineNow = await DriverProfile.countDocuments({
            availabilityStatus: "ONLINE",
        });

        if (onlineNow === 0) {
            await markSearchFailed(
                order,
                `[dispatch] Order ${orderId}: no online drivers at all during fallback phase — failing search early instead of waiting out remaining fallback cooldowns`
            );

            return { dispatched: false, exhausted: true };
        }
    }

    const radiusKm = isFallbackRound
        ? RADIUS_KM_BY_ROUND[RADIUS_KM_BY_ROUND.length - 1]
        : RADIUS_KM_BY_ROUND[nextRound - 1];

    const storeCoords = order.storeId?.coordinates;
    const hasStoreLocation = storeCoords?.lat && storeCoords?.lng;

    const deliveryCoords = order.deliveryCoordinates;
    const hasDeliveryLocation = deliveryCoords?.lat && deliveryCoords?.lng;

    const deliveryDistanceKm =
        hasStoreLocation && hasDeliveryLocation
            ? Math.round(haversineKm(storeCoords, deliveryCoords) * 10) / 10
            : 0;

    // last round's unanswered requests don't carry over
    await DriverDeliveryRequest.updateMany(
        { orderId: order._id, status: "PENDING" },
        { status: "EXPIRED" }
    );

    // fallback round re-includes drivers who rejected earlier — better than nothing
    const excludedDriverIds = isFallbackRound ? [] : await getExcludedDriverIds(order._id);

    const cutoff = new Date(Date.now() - STALE_LOCATION_THRESHOLD_MS);

    const onlineDrivers = await DriverProfile.find({
        availabilityStatus: "ONLINE",
        _id: { $nin: excludedDriverIds },
        ...codRestrictionFilterFor(order.paymentMethod),
        ...(hasStoreLocation && {
            "currentLocation.lat": { $ne: null },
            "currentLocation.lng": { $ne: null },
            lastLocationUpdate: { $gte: cutoff },
        }),
    }).select("_id currentLocation");

    const nearbyDrivers = hasStoreLocation
        ? onlineDrivers
              .map((driver) => {
                  if (!driver.currentLocation?.lat || !driver.currentLocation?.lng) {
                      return null;
                  }

                  const pickupDistanceKm =
                      Math.round(haversineKm(storeCoords, driver.currentLocation) * 10) / 10;

                  return pickupDistanceKm <= radiusKm
                      ? { driverId: driver._id, pickupDistanceKm }
                      : null;
              })
              .filter(Boolean)
        : onlineDrivers.map((driver) => ({ driverId: driver._id, pickupDistanceKm: 0 }));

    const requestExpiresAt = new Date(Date.now() + REQUEST_EXPIRY_SECONDS * 1000);

    const nextRoundDelayMs = isFallbackRound
        ? FALLBACK_COOLDOWN_MS
        : REQUEST_EXPIRY_SECONDS * 1000;

    order.deliveryRequestRound = nextRound;
    order.deliveryRoundExpiresAt = new Date(Date.now() + nextRoundDelayMs);

    await order.save();

    if (!nearbyDrivers.length) {
        console.warn(
            `[dispatch] Round ${nextRound}${isFallbackRound ? " (fallback)" : ""} for order ${orderId}: no eligible drivers within ${radiusKm}km`
        );

        return { dispatched: false, exhausted: false };
    }

    await createAndEmitRequests(order, nearbyDrivers, requestExpiresAt, deliveryDistanceKm);

    console.log(
        `[dispatch] Round ${nextRound}${isFallbackRound ? " (fallback)" : ""} for order ${orderId}: sent to ${nearbyDrivers.length} driver(s) within ${radiusKm}km`
    );

    return { dispatched: true, exhausted: false };
};

// when a driver comes back online, check if any waiting orders are within reach
const dispatchToOnlineDriver = async (driver) => {
    if (!driver?.currentLocation?.lat || !driver?.currentLocation?.lng) {
        return;
    }

    const pendingRequests = await DriverDeliveryRequest.find({
        driverId: driver._id,
        status: "PENDING",
    })
        .select("orderId")
        .lean();

    const pendingOrderIds = pendingRequests.map((r) => r.orderId);

    const rejectedRequests = await DriverDeliveryRequest.find({
        driverId: driver._id,
        status: "REJECTED",
    })
        .select("orderId")
        .lean();

    const rejectedOrderIdSet = new Set(rejectedRequests.map((r) => r.orderId.toString()));

    const candidateOrders = await Order.find({
        orderStatus: "READY_FOR_PICKUP",
        driverId: null,
        driverSearchFailed: false,
        _id: { $nin: pendingOrderIds },
    })
        .populate({
            path: "storeId",
            select: "storeName address coordinates",
        })
        .select(
            "orderNumber recipientName deliveryAddress deliveryCoordinates totalAmount paymentMethod products storeId deliveryRequestRound"
        );

    const widestRadiusKm = RADIUS_KM_BY_ROUND[RADIUS_KM_BY_ROUND.length - 1];

    for (const order of candidateOrders) {
        const isFallbackPhase = order.deliveryRequestRound > MAX_DISPATCH_ROUNDS;

        if (!isFallbackPhase && rejectedOrderIdSet.has(order._id.toString())) {
            continue;
        }

        if (!isEligibleForOrder(driver, order)) {
            continue;
        }

        const storeCoords = order.storeId?.coordinates;

        if (!storeCoords?.lat || !storeCoords?.lng) {
            continue;
        }

        const pickupDistanceKm =
            Math.round(haversineKm(storeCoords, driver.currentLocation) * 10) / 10;

        if (pickupDistanceKm > widestRadiusKm) {
            continue;
        }

        const deliveryCoords = order.deliveryCoordinates;
        const hasDeliveryLocation = deliveryCoords?.lat && deliveryCoords?.lng;

        const deliveryDistanceKm = hasDeliveryLocation
            ? Math.round(haversineKm(storeCoords, deliveryCoords) * 10) / 10
            : 0;

        const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_SECONDS * 1000);

        await createAndEmitRequests(
            order,
            [{ driverId: driver._id, pickupDistanceKm }],
            expiresAt,
            deliveryDistanceKm
        );

        console.log(`[dispatch] Catch-up: order ${order._id} sent to newly-online driver ${driver._id}`);
    }
};

module.exports = {
    dispatchRound,
    dispatchToOnlineDriver,
    MAX_DISPATCH_ROUNDS,
};