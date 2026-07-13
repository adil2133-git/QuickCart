const Order = require("../models/shared/order");
const DriverProfile = require("../models/driver/driverProfile");
const StoreProfile = require("../models/store/storeProfile");
const DriverDeliveryRequest = require("../models/driver/driverDeliveryRequest");

const { haversineKm } = require("../utils/distance");
const { emitToDriver } = require("../socket");
const { notifyStore } = require("./notificationService");

// Driver location is considered stale after 5 minutes
const STALE_LOCATION_THRESHOLD_MS = 5 * 60 * 1000;

// Driver has 30 seconds to accept or reject
const REQUEST_EXPIRY_SECONDS = 30;

// Search radius for each dispatch round
const RADIUS_KM_BY_ROUND = [5, 8, 10];
const MAX_DISPATCH_ROUNDS = RADIUS_KM_BY_ROUND.length;

// Fallback settings
const FALLBACK_COOLDOWN_MS = 2 * 60 * 1000;
const FALLBACK_ATTEMPTS = 2;
const TOTAL_DISPATCH_ROUNDS =
    MAX_DISPATCH_ROUNDS + FALLBACK_ATTEMPTS;

// Driver earning settings
const BASE_FARE = 15;
const RATE_PER_KM = 6;

// Calculate estimated earnings
const estimateEarnings = (pickupKm, deliveryKm) =>
    Math.round(
        (
            BASE_FARE +
            RATE_PER_KM * (pickupKm + deliveryKm)
        ) * 100
    ) / 100;

// Load required order details for dispatch
const loadOrderForDispatch = (orderId) =>
    Order.findById(orderId)
        .populate({
            path: "storeId",
            select: "storeName address coordinates",
        })
        .select(
            "orderNumber recipientName deliveryAddress deliveryCoordinates totalAmount paymentMethod products storeId orderStatus driverId deliveryRequestRound driverSearchFailed"
        );

// Get drivers who already rejected this order
const getExcludedDriverIds = async (orderId) => {
    const rejected = await DriverDeliveryRequest.find({
        orderId,
        status: "REJECTED",
    })
        .select("driverId")
        .lean();

    return rejected.map((r) => r.driverId.toString());
};

// Create delivery request documents and emit socket events
const createAndEmitRequests = async (
    order,
    driverDistancePairs,
    expiresAt,
    deliveryDistanceKm
) => {
    const requests = await DriverDeliveryRequest.insertMany(
        driverDistancePairs.map(
            ({ driverId, pickupDistanceKm }) => ({
                orderId: order._id,
                driverId,
                status: "PENDING",
                pickupDistanceKm,
                deliveryDistanceKm,
                estimatedEarnings: estimateEarnings(
                    pickupDistanceKm,
                    deliveryDistanceKm
                ),
                expiresAt,
            })
        ),
        { ordered: false }
    );

    const basePayload = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        recipientName: order.recipientName,
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        itemCount: (order.products || []).reduce(
            (sum, item) => sum + item.quantity,
            0
        ),
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

// Send the current dispatch round to nearby drivers
const dispatchRound = async (orderId) => {
    const order = await loadOrderForDispatch(orderId);

    if (!order) {
        console.warn(`[dispatch] Order ${orderId} not found`);
        return { dispatched: false, exhausted: false };
    }

    // Stop if order is no longer eligible for dispatch
    if (
        order.orderStatus !== "READY_FOR_PICKUP" ||
        order.driverId ||
        order.driverSearchFailed
    ) {
        return { dispatched: false, exhausted: false };
    }

    const nextRound = order.deliveryRequestRound + 1;
    const isFallbackRound = nextRound > MAX_DISPATCH_ROUNDS;

    // Stop searching if all rounds are completed
    if (nextRound > TOTAL_DISPATCH_ROUNDS) {
        order.driverSearchFailed = true;
        await order.save();

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

        console.warn(
            `[dispatch] Order ${orderId} exhausted all ${MAX_DISPATCH_ROUNDS} rounds + ${FALLBACK_ATTEMPTS} fallback attempts — no driver found`
        );

        return {
            dispatched: false,
            exhausted: true,
        };
    }

    // Fail fast: if there isn't a single online driver anywhere right now,
    // there's no point burning through the remaining rounds/fallback cooldowns —
    // nothing about widening the radius will help when nobody is online at all.
    const onlineDriverCount = await DriverProfile.countDocuments({
        availabilityStatus: "ONLINE",
    });

    if (onlineDriverCount === 0) {
        order.driverSearchFailed = true;
        await order.save();

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

        console.warn(
            `[dispatch] Order ${orderId}: no online drivers at all — failing search early instead of waiting out remaining rounds`
        );

        return { dispatched: false, exhausted: true };
    }

    // Select search radius
    const radiusKm = isFallbackRound
        ? RADIUS_KM_BY_ROUND[RADIUS_KM_BY_ROUND.length - 1]
        : RADIUS_KM_BY_ROUND[nextRound - 1];

    const storeCoords = order.storeId?.coordinates;
    const hasStoreLocation =
        storeCoords?.lat && storeCoords?.lng;

    const deliveryCoords = order.deliveryCoordinates;
    const hasDeliveryLocation =
        deliveryCoords?.lat && deliveryCoords?.lng;

    const deliveryDistanceKm =
        hasStoreLocation && hasDeliveryLocation
            ? Math.round(
                  haversineKm(storeCoords, deliveryCoords) * 10
              ) / 10
            : 0;

    // Expire pending requests from previous round
    await DriverDeliveryRequest.updateMany(
        {
            orderId: order._id,
            status: "PENDING",
        },
        {
            status: "EXPIRED",
        }
    );

    // Ignore rejected drivers during normal rounds
    const excludedDriverIds = isFallbackRound
        ? []
        : await getExcludedDriverIds(order._id);

    const cutoff = new Date(
        Date.now() - STALE_LOCATION_THRESHOLD_MS
    );

    // Find online drivers
    const onlineDrivers = await DriverProfile.find({
        availabilityStatus: "ONLINE",
        _id: {
            $nin: excludedDriverIds,
        },
        ...(hasStoreLocation && {
            "currentLocation.lat": { $ne: null },
            "currentLocation.lng": { $ne: null },
            lastLocationUpdate: {
                $gte: cutoff,
            },
        }),
    }).select("_id currentLocation");

    // Filter drivers inside current search radius
    const nearbyDrivers = hasStoreLocation
        ? onlineDrivers
              .map((driver) => {
                  if (
                      !driver.currentLocation?.lat ||
                      !driver.currentLocation?.lng
                  ) {
                      return null;
                  }

                  const pickupDistanceKm =
                      Math.round(
                          haversineKm(
                              storeCoords,
                              driver.currentLocation
                          ) * 10
                      ) / 10;

                  return pickupDistanceKm <= radiusKm
                      ? {
                            driverId: driver._id,
                            pickupDistanceKm,
                        }
                      : null;
              })
              .filter(Boolean)
        : onlineDrivers.map((driver) => ({
              driverId: driver._id,
              pickupDistanceKm: 0,
          }));

    const requestExpiresAt = new Date(
        Date.now() + REQUEST_EXPIRY_SECONDS * 1000
    );

    const nextRoundDelayMs = isFallbackRound
        ? FALLBACK_COOLDOWN_MS
        : REQUEST_EXPIRY_SECONDS * 1000;

    order.deliveryRequestRound = nextRound;
    order.deliveryRoundExpiresAt = new Date(
        Date.now() + nextRoundDelayMs
    );

    await order.save();

    if (!nearbyDrivers.length) {
        console.warn(
            `[dispatch] Round ${nextRound}${
                isFallbackRound ? " (fallback)" : ""
            } for order ${orderId}: no eligible drivers within ${radiusKm}km`
        );

        return {
            dispatched: false,
            exhausted: false,
        };
    }

    await createAndEmitRequests(
        order,
        nearbyDrivers,
        requestExpiresAt,
        deliveryDistanceKm
    );

    console.log(
        `[dispatch] Round ${nextRound}${
            isFallbackRound ? " (fallback)" : ""
        } for order ${orderId}: sent to ${nearbyDrivers.length} driver(s) within ${radiusKm}km`
    );

    return {
        dispatched: true,
        exhausted: false,
    };
};

// Send waiting orders to a driver who just came online
const dispatchToOnlineDriver = async (driver) => {
    if (!driver?.currentLocation?.lat || !driver?.currentLocation?.lng) {
        return;
    }

    // Get pending requests for this driver
    const pendingRequests = await DriverDeliveryRequest.find({
        driverId: driver._id,
        status: "PENDING",
    })
        .select("orderId")
        .lean();

    const pendingOrderIds = pendingRequests.map(
        (request) => request.orderId
    );

    // Get rejected orders for this driver
    const rejectedRequests = await DriverDeliveryRequest.find({
        driverId: driver._id,
        status: "REJECTED",
    })
        .select("orderId")
        .lean();

    const rejectedOrderIdSet = new Set(
        rejectedRequests.map((request) =>
            request.orderId.toString()
        )
    );

    // Find orders waiting for a driver
    const candidateOrders = await Order.find({
        orderStatus: "READY_FOR_PICKUP",
        driverId: null,
        driverSearchFailed: false,
        _id: {
            $nin: pendingOrderIds,
        },
    })
        .populate({
            path: "storeId",
            select: "storeName address coordinates",
        })
        .select(
            "orderNumber recipientName deliveryAddress deliveryCoordinates totalAmount paymentMethod products storeId deliveryRequestRound"
        );

    const widestRadiusKm =
        RADIUS_KM_BY_ROUND[RADIUS_KM_BY_ROUND.length - 1];

    for (const order of candidateOrders) {
        const isFallbackPhase =
            order.deliveryRequestRound > MAX_DISPATCH_ROUNDS;

        // Skip rejected orders during normal rounds
        if (
            !isFallbackPhase &&
            rejectedOrderIdSet.has(order._id.toString())
        ) {
            continue;
        }

        const storeCoords = order.storeId?.coordinates;

        if (!storeCoords?.lat || !storeCoords?.lng) {
            continue;
        }

        const pickupDistanceKm =
            Math.round(
                haversineKm(
                    storeCoords,
                    driver.currentLocation
                ) * 10
            ) / 10;

        if (pickupDistanceKm > widestRadiusKm) {
            continue;
        }

        const deliveryCoords = order.deliveryCoordinates;

        const hasDeliveryLocation =
            deliveryCoords?.lat &&
            deliveryCoords?.lng;

        const deliveryDistanceKm = hasDeliveryLocation
            ? Math.round(
                  haversineKm(
                      storeCoords,
                      deliveryCoords
                  ) * 10
              ) / 10
            : 0;

        const expiresAt = new Date(
            Date.now() + REQUEST_EXPIRY_SECONDS * 1000
        );

        await createAndEmitRequests(
            order,
            [
                {
                    driverId: driver._id,
                    pickupDistanceKm,
                },
            ],
            expiresAt,
            deliveryDistanceKm
        );

        console.log(
            `[dispatch] Catch-up: order ${order._id} sent to newly-online driver ${driver._id}`
        );
    }
};

module.exports = {
    dispatchRound,
    dispatchToOnlineDriver,
    MAX_DISPATCH_ROUNDS,
};