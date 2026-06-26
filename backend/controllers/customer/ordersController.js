const Order = require("../../models/shared/order");
const CustomerProfile = require("../../models/customer/customerProfile");
const Product = require("../../models/store/product");

// ─── Helper: resolve customerId from the JWT user ─────────────────────────────
const resolveCustomerId = async (req) => {
    let profile = await CustomerProfile.findOne({ userId: req.user.userID }).select("_id");

    if (!profile) {
        profile = await CustomerProfile.create({ userId: req.user.userID });
    }

    return profile._id;
};

// ─── Status mapping ───────────────────────────────────────────────────────────
// The real orderStatus enum has 9 states (driver/pickup granularity that the
// store + driver apps need). The customer-facing "My Orders" UI only shows a
// simplified 3-stage tracker (Processing → Packed → Delivery), so we collapse
// the real enum down here rather than exposing all 9 states to the frontend.
//
// Adjust this mapping if you want READY_FOR_PICKUP to visually count as
// "Packed" instead of "Delivery" — it's a judgment call, currently grouped
// with the delivery stage since the order has left the store's hands.
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

// Percent shown on the progress bar — also a judgment call, not derived from
// anything stored on the order. Tune these if you want different pacing.
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
// Note: Order.products[] only snapshots productId/productName/quantity/price
// at order time — no image. To show a thumbnail we look up the live product
// image separately (productImageMap, built in getOrders/getOrderDetail below).
// This means the thumbnail reflects the product's CURRENT image, not
// necessarily what it looked like when ordered — acceptable since images
// rarely change, but worth knowing if that ever matters.
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

        // Gather the first product image of each order's first item, in one
        // batched query rather than N+1 lookups per order.
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

        // Driver assignment isn't built yet, so driverId is always null right
        // now — once delivery assignment exists, populate driverId.userId
        // (DriverProfile -> User) here for name/phone, since DriverProfile
        // itself doesn't store those fields.
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
                driver: null, // populate once delivery assignment exists
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

module.exports = {
    getOrders,
    getOrderDetail,
};