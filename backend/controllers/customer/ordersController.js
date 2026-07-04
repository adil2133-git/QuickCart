const Order = require("../../models/shared/order");
const Product = require("../../models/store/product");
const { resolveCustomerProfile } = require("../../services/customerProfileService");

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

module.exports = {
    getOrders,
    getOrderDetail,
};