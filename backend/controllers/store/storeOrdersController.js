const Order = require("../../models/shared/order");
const StoreProfile = require("../../models/store/storeProfile");

const resolveStoreId = async (req) => {
    const store = await StoreProfile.findOne({ userId: req.user.userID }).select("_id");
    if (!store) throw new Error("Store profile not found");
    return store._id;
};

const ALLOWED_TRANSITIONS = {
    PENDING:          ["ACCEPTED", "CANCELLED"],   // also allow direct cancel from PENDING
    ACCEPTED:         ["PACKING"],
    PACKING:          ["READY_FOR_PICKUP"],
    READY_FOR_PICKUP: [],
};

// Tab → actual DB statuses
const TAB_STATUS_MAP = {
    PENDING:  ["PENDING"],
    ACCEPTED: ["ACCEPTED"],
    READY:    ["READY_FOR_PICKUP"],
    ALL:      [
        "PENDING", "ACCEPTED", "PACKING", "READY_FOR_PICKUP",
        "DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY",
        "DELIVERED", "CANCELLED",
    ],
};

const toListShape = (order) => ({
    id:              order._id.toString(),
    orderNumber:     order.orderNumber,
    placedAt:        order.createdAt,
    recipientName:   order.recipientName,
    recipientPhone:  order.recipientPhone,
    deliveryAddress: order.deliveryAddress,
    paymentMethod:   order.paymentMethod,
    paymentStatus:   order.paymentStatus,
    orderStatus:     order.orderStatus,
    itemCount:       (order.products || []).reduce((sum, i) => sum + i.quantity, 0),
    subtotal:        order.subtotal,
    deliveryCharge:  order.deliveryCharge,
    totalAmount:     order.totalAmount,
    products:        order.products || [],
});

// ── Helper: prevent browser/proxy caching so tab changes always hit the DB ───
const setNoCacheHeaders = (res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma":        "no-cache",
        "Expires":       "0",
        "Surrogate-Control": "no-store",
    });
};

// ─── GET /api/store/orders?tab=ALL&search=&page=1&limit=10 ───────────────────
const getStoreOrders = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        const tab    = req.query.tab    || "ALL";
        const search = req.query.search || "";
        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.max(1, parseInt(req.query.limit) || 10);
        const skip   = (page - 1) * limit;

        // ── Build filter ──────────────────────────────────────────────────────
        const statusList = TAB_STATUS_MAP[tab] ?? TAB_STATUS_MAP.ALL;

        const filter = {
            storeId,
            orderStatus: { $in: statusList },
        };

        if (search.trim()) {
            filter.$or = [
                { orderNumber:    { $regex: search.trim(), $options: "i" } },
                { recipientName:  { $regex: search.trim(), $options: "i" } },
                { recipientPhone: { $regex: search.trim(), $options: "i" } },
            ];
        }

        // ── Query ─────────────────────────────────────────────────────────────
        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ]);

        // ── Disable caching so different tabs always get fresh results ────────
        setNoCacheHeaders(res);

        return res.status(200).json({
            success: true,
            orders:  orders.map(toListShape),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
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

        return res.status(200).json({
            success: true,
            order: toListShape(order),
        });
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