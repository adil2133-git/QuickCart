const Notification = require("../models/shared/notification");
const CustomerProfile = require("../models/customer/customerProfile");
const StoreProfile = require("../models/store/storeProfile");
const DriverProfile = require("../models/driver/driverProfile");
const { emitToCustomer, emitToStore, emitToDriver } = require("../socket");

// ─── Room resolver ────────────────────────────────────────────────────────────
// Rooms are keyed by Profile._id, not userId. This maps userId → profileId.
async function resolveProfileId(userId, role) {
    const Model = role === "CUSTOMER" ? CustomerProfile
                : role === "STORE"    ? StoreProfile
                : role === "DRIVER"   ? DriverProfile
                : null;
    if (!Model) return null;
    const p = await Model.findOne({ userId }).select("_id").lean();
    return p?._id ?? null;
}

// ─── Core: save to DB + emit via socket ──────────────────────────────────────
async function notify({ userId, role, title, message, type = "ORDER", orderId = null }) {
    try {
        const saved = await Notification.create({ userId, title, message, type, orderId });

        const profileId = await resolveProfileId(userId, role);
        if (!profileId) return;

        const payload = {
            _id:       saved._id.toString(),
            title,
            message,
            type:      saved.type,
            orderId:   orderId ? orderId.toString() : null,
            isRead:    false,
            createdAt: saved.createdAt,
        };

        if (role === "CUSTOMER") emitToCustomer(profileId, "notification:new", payload);
        else if (role === "STORE")   emitToStore(profileId,    "notification:new", payload);
        else if (role === "DRIVER")  emitToDriver(profileId,   "notification:new", payload);
    } catch (err) {
        console.error("[notificationService] Failed:", err.message);
    }
}

// ─── Order lifecycle — customer ───────────────────────────────────────────────
const notifyCustomer = {
    orderPlaced: (userId, orderNumber, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "ORDER",
        title:   "Order Received",
        message: `Your order #${orderNumber} has been received. Waiting for store confirmation.`,
    }),
    accepted: (userId, orderNumber, storeName, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "ORDER",
        title:   "Order Accepted ✅",
        message: `${storeName} has accepted your order #${orderNumber}.`,
    }),
    packing: (userId, orderNumber, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "ORDER",
        title:   "Being Packed 📦",
        message: `Your order #${orderNumber} is being carefully packed.`,
    }),
    searchingDriver: (userId, orderNumber, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "DELIVERY",
        title:   "Finding Your Driver 🔍",
        message: `Order #${orderNumber} is ready. We're finding a nearby driver.`,
    }),
    driverAssigned: (userId, orderNumber, driverName, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "DELIVERY",
        title:   "Driver Assigned 🛵",
        message: `${driverName} has been assigned and is heading to the store.`,
    }),
    pickedUp: (userId, orderNumber, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "DELIVERY",
        title:   "Order Picked Up 🛵",
        message: `Your order #${orderNumber} has been picked up and is on the way!`,
    }),
    outForDelivery: (userId, orderNumber, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "DELIVERY",
        title:   "Out For Delivery 🚀",
        message: `Your order #${orderNumber} is out for delivery. Get ready!`,
    }),
    delivered: (userId, orderNumber, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "ORDER",
        title:   "Order Delivered 🎉",
        message: `Your order #${orderNumber} has been delivered. Enjoy!`,
    }),
    cancelled: (userId, orderNumber, orderId) => notify({
        userId, role: "CUSTOMER", orderId, type: "ORDER",
        title:   "Order Cancelled ❌",
        message: `Your order #${orderNumber} has been cancelled.`,
    }),
};

// ─── Order lifecycle — store ──────────────────────────────────────────────────
const notifyStore = {
    driverAssigned: (userId, orderNumber, driverName, orderId) => notify({
        userId, role: "STORE", orderId, type: "DELIVERY",
        title:   "Driver Assigned 🛵",
        message: `${driverName} accepted order #${orderNumber} and is heading to your store.`,
    }),
    driverArrived: (userId, orderNumber, driverName, orderId) => notify({
        userId, role: "STORE", orderId, type: "DELIVERY",
        title:   "Driver Arrived",
        message: `${driverName} has arrived at your store to pick up order #${orderNumber}.`,
    }),
    cancelledByCustomer: (userId, orderNumber, orderId) => notify({
        userId, role: "STORE", orderId, type: "ORDER",
        title:   "Order Cancelled ❌",
        message: `The customer cancelled order #${orderNumber}.`,
    }),
};

// ─── Order lifecycle — driver ─────────────────────────────────────────────────
const notifyDriver = {
    assigned: (userId, orderNumber, storeName, orderId) => notify({
        userId, role: "DRIVER", orderId, type: "DELIVERY",
        title:   "Delivery Assigned 📦",
        message: `You've been assigned order #${orderNumber} from ${storeName}. Head to the store to pick it up.`,
    }),
    delivered: (userId, orderNumber, earnings, orderId) => notify({
        userId, role: "DRIVER", orderId, type: "ORDER",
        title:   "Delivery Completed 🎉",
        message: `Order #${orderNumber} delivered successfully. You earned ₹${earnings}.`,
    }),
};

module.exports = { notifyCustomer, notifyStore, notifyDriver };