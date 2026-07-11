const { haversineKm } = require("../utils/distance");

// All values here per "Money Handling & Business Rules" Section 14 —
// keep this the single place these numbers live. If these ever move to a
// settings table, this is the only file that needs to change.
const HANDLING_FEE = 15;
const MIN_ORDER_VALUE = 150;
const FREE_DELIVERY_THRESHOLD = 499; // subtotal strictly above this waives delivery charge
const MAX_DELIVERABLE_KM = 8;
const DELIVERY_TIERS = [
    { maxKm: 2, charge: 20 },
    { maxKm: 5, charge: 35 },
    { maxKm: 8, charge: 50 },
];

class PricingError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "PricingError";
        this.status = status;
    }
}

// ─── Store → Customer distance ───────────────────────────────────────────────
// Always store → customer, never the driver's location — the driver isn't
// assigned yet at checkout time anyway.
const resolveDistanceKm = (storeCoordinates, addressCoordinates) => {
    if (
        !addressCoordinates ||
        typeof addressCoordinates.lat !== "number" ||
        typeof addressCoordinates.lng !== "number"
    ) {
        throw new PricingError(
            "This delivery address is missing location coordinates. Please pick a different address or re-add this one."
        );
    }
    if (
        !storeCoordinates ||
        typeof storeCoordinates.lat !== "number" ||
        typeof storeCoordinates.lng !== "number"
    ) {
        throw new PricingError("Store location is unavailable right now. Please try again shortly.");
    }

    return haversineKm(storeCoordinates, addressCoordinates);
};

const deliveryChargeForDistance = (distanceKm) => {
    const tier = DELIVERY_TIERS.find((t) => distanceKm <= t.maxKm);
    if (!tier) {
        throw new PricingError(
            "This store is too far from your delivery address to be delivered to.",
            409
        );
    }
    return tier.charge;
};

// ─── Full bill breakdown ──────────────────────────────────────────────────────
// subtotal: sum of product prices × quantity (server-recomputed, never trusted from client)
// storeCoordinates / addressCoordinates: { lat, lng }
const computeBill = ({ subtotal, storeCoordinates, addressCoordinates }) => {
    if (subtotal < MIN_ORDER_VALUE) {
        throw new PricingError(`Minimum order value is ₹${MIN_ORDER_VALUE}. Add a few more items to continue.`);
    }

    const distanceKm = resolveDistanceKm(storeCoordinates, addressCoordinates);

    if (distanceKm > MAX_DELIVERABLE_KM) {
        throw new PricingError(
            "This store is outside our delivery range for your address.",
            409
        );
    }

    const freeDeliveryApplied = subtotal > FREE_DELIVERY_THRESHOLD;
    const deliveryCharge = freeDeliveryApplied ? 0 : deliveryChargeForDistance(distanceKm);
    const handlingFee = HANDLING_FEE;
    const totalAmount = subtotal + deliveryCharge + handlingFee;

    return {
        subtotal,
        deliveryCharge,
        handlingFee,
        totalAmount,
        distanceKm: Math.round(distanceKm * 100) / 100,
        freeDeliveryApplied,
    };
};

module.exports = {
    computeBill,
    resolveDistanceKm,
    deliveryChargeForDistance,
    PricingError,
    HANDLING_FEE,
    MIN_ORDER_VALUE,
    FREE_DELIVERY_THRESHOLD,
    MAX_DELIVERABLE_KM,
};