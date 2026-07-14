const Order = require("../../models/shared/order");
const OrderStatusHistory = require("../../models/shared/orderStatusHistory");
const User = require("../../models/shared/user");
const DriverProfile = require("../../models/driver/driverProfile");
const StoreProfile = require("../../models/store/storeProfile");

function startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function daysAgo(n, from = new Date()) {
    const d = startOfDay(from);
    d.setDate(d.getDate() - n);
    return d;
}

// returns a UI-ready trend object, guarding against divide-by-zero
function trend(current, previous) {
    if (previous === 0) {
        if (current === 0) return { direction: "neutral", label: "No change" };
        return { direction: "up", label: "New today" };
    }
    const pct = ((current - previous) / previous) * 100;
    const direction = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
    return { direction, label: `${Math.abs(Math.round(pct))}%` };
}

// collapses the 9-value orderStatus enum into the 4 buckets the dashboard UI uses
function bucketOrderStatus(status) {
    if (status === "DELIVERED") return "Delivered";
    if (status === "CANCELLED") return "Cancelled";
    if (status === "OUT_FOR_DELIVERY" || status === "PICKED_UP") return "Out for Delivery";
    return "Processing"; // PENDING, ACCEPTED, PACKING, READY_FOR_PICKUP, DRIVER_ASSIGNED
}

function mapPayment(method) {
    return method === "ONLINE" ? "Online" : "COD";
}

// GET /admin/dashboard/kpis
const getDashboardKpis = async (req, res) => {
    try {
        const todayStart = startOfDay();
        const yesterdayStart = daysAgo(1);

        const [
            ordersToday,
            ordersYesterday,
            revenueTodayAgg,
            revenueYesterdayAgg,
            driversOnline,
            storesActive,
            deliveredToday,
            deliveredYesterday,
        ] = await Promise.all([
            Order.countDocuments({ createdAt: { $gte: todayStart } }),
            Order.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
            Order.aggregate([
                { $match: { createdAt: { $gte: todayStart }, orderStatus: { $ne: "CANCELLED" } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: yesterdayStart, $lt: todayStart }, orderStatus: { $ne: "CANCELLED" } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } },
            ]),
            DriverProfile.countDocuments({ availabilityStatus: "ONLINE" }),
            StoreProfile.countDocuments({ storeStatus: "OPEN" }),
            avgDeliveryMinutes(todayStart, new Date()),
            avgDeliveryMinutes(yesterdayStart, todayStart),
        ]);

        const revenueToday = revenueTodayAgg[0]?.total || 0;
        const revenueYesterday = revenueYesterdayAgg[0]?.total || 0;

        return res.status(200).json({
            success: true,
            kpis: {
                ordersToday: { value: ordersToday, ...trend(ordersToday, ordersYesterday) },
                revenueToday: { value: revenueToday, ...trend(revenueToday, revenueYesterday) },
                driversOnline: { value: driversOnline },
                storesActive: { value: storesActive },
                avgDeliveryMinutes: {
                    value: deliveredToday,
                    // whether "down" is good or bad is decided in the UI — this just reports the raw change
                    ...trend(deliveredToday, deliveredYesterday),
                },
            },
        });
    } catch (err) {
        console.error("[getDashboardKpis]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// average minutes between order creation and DELIVERED status, in [from, to)
async function avgDeliveryMinutes(from, to) {
    const delivered = await OrderStatusHistory.aggregate([
        { $match: { status: "DELIVERED", timestamp: { $gte: from, $lt: to } } },
        {
            $lookup: {
                from: "orders",
                localField: "orderId",
                foreignField: "_id",
                as: "order",
            },
        },
        { $unwind: "$order" },
        {
            $project: {
                minutes: {
                    $divide: [{ $subtract: ["$timestamp", "$order.createdAt"] }, 60000],
                },
            },
        },
        { $group: { _id: null, avg: { $avg: "$minutes" } } },
    ]);
    return delivered[0]?.avg ? Math.round(delivered[0].avg) : 0;
}

// GET /admin/dashboard/operations
const getOperationsIntelligence = async (req, res) => {
    try {
        const sevenDaysAgo = daysAgo(6); // today + 6 previous = 7 days
        const thirtyDaysAgo = daysAgo(29);

        const [revenueByDay, statusCounts, driverCounts, storeCounts] = await Promise.all([
            Order.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo }, orderStatus: { $ne: "CANCELLED" } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        total: { $sum: "$totalAmount" },
                    },
                },
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
            ]),
            DriverProfile.aggregate([
                { $group: { _id: "$availabilityStatus", count: { $sum: 1 } } },
            ]),
            StoreProfile.aggregate([
                { $group: { _id: "$storeStatus", count: { $sum: 1 } } },
            ]),
        ]);

        // full 7-day series including days with ₹0 revenue, oldest -> newest
        const revenueMap = new Map(revenueByDay.map((r) => [r._id, r.total]));
        const revenueTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = daysAgo(i);
            const key = d.toISOString().slice(0, 10);
            revenueTrend.push({
                day: d.toLocaleDateString("en-IN", { weekday: "short" }),
                value: revenueMap.get(key) || 0,
                active: i === 0,
            });
        }

        const orderStatusBuckets = { Delivered: 0, Processing: 0, "Out for Delivery": 0, Cancelled: 0 };
        statusCounts.forEach((s) => {
            orderStatusBuckets[bucketOrderStatus(s._id)] += s.count;
        });

        const driverHealth = { ONLINE: 0, BUSY: 0, OFFLINE: 0 };
        driverCounts.forEach((d) => {
            if (d._id in driverHealth) driverHealth[d._id] = d.count;
        });

        const storeHealth = { OPEN: 0, BUSY: 0, CLOSED: 0 };
        storeCounts.forEach((s) => {
            if (s._id in storeHealth) storeHealth[s._id] = s.count;
        });

        return res.status(200).json({
            success: true,
            revenueTrend,
            orderStatus: orderStatusBuckets,
            driverHealth,
            storeHealth,
        });
    } catch (err) {
        console.error("[getOperationsIntelligence]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /admin/dashboard/recent-orders
const getRecentOrders = async (req, res) => {
    try {
        const { search = "", limit = 8 } = req.query;
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 8));

        const pipeline = [
            { $sort: { createdAt: -1 } },
            { $limit: 300 }, // cap the working set before the text filter, keeps this cheap
            {
                $lookup: {
                    from: "customerprofiles",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerProfile",
                },
            },
            { $unwind: { path: "$customerProfile", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "customerProfile.userId",
                    foreignField: "_id",
                    as: "customerUser",
                },
            },
            { $unwind: { path: "$customerUser", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "storeprofiles",
                    localField: "storeId",
                    foreignField: "_id",
                    as: "store",
                },
            },
            { $unwind: { path: "$store", preserveNullAndEmptyArrays: true } },
        ];

        if (search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            pipeline.push({
                $match: {
                    $or: [
                        { orderNumber: regex },
                        { "customerUser.name": regex },
                        { "store.storeName": regex },
                    ],
                },
            });
        }

        pipeline.push({ $limit: limitNum });

        const rows = await Order.aggregate(pipeline);

        const orders = rows.map((o) => ({
            id: o.orderNumber,
            customer: o.customerUser?.name || "Unknown customer",
            store: o.store?.storeName || "Unknown store",
            amount: o.totalAmount,
            payment: mapPayment(o.paymentMethod),
            status: bucketOrderStatus(o.orderStatus),
            createdAt: o.createdAt,
        }));

        return res.status(200).json({ success: true, orders });
    } catch (err) {
        console.error("[getRecentOrders]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /admin/dashboard/action-rail
// only surfaces signals we can actually compute today — stale pending
// approvals and stuck orders. COD reconciliation/SLA tracking aren't
// implemented yet, so those cards are left out rather than faked.
const getActionRail = async (req, res) => {
    try {
        const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const stuckOrderThreshold = new Date(Date.now() - 45 * 60 * 1000);

        const [
            stalePendingStores,
            stalePendingDrivers,
            stuckOrders,
            pendingStoreUsers,
            pendingDriverUsers,
        ] = await Promise.all([
            User.countDocuments({ role: "STORE", status: "PENDING_APPROVAL", createdAt: { $lte: staleThreshold } }),
            User.countDocuments({ role: "DRIVER", status: "PENDING_APPROVAL", createdAt: { $lte: staleThreshold } }),
            Order.countDocuments({
                orderStatus: { $nin: ["DELIVERED", "CANCELLED"] },
                createdAt: { $lte: stuckOrderThreshold },
            }),
            User.find({ role: "STORE", status: "PENDING_APPROVAL" })
                .sort({ createdAt: -1 })
                .limit(3)
                .select("_id name createdAt")
                .lean(),
            User.find({ role: "DRIVER", status: "PENDING_APPROVAL" })
                .sort({ createdAt: -1 })
                .limit(3)
                .select("_id name createdAt")
                .lean(),
        ]);

        const storeIds = pendingStoreUsers.map((u) => u._id);
        const driverIds = pendingDriverUsers.map((u) => u._id);

        const [storeProfiles, driverProfiles] = await Promise.all([
            StoreProfile.find({ userId: { $in: storeIds } }).select("userId storeName").lean(),
            DriverProfile.find({ userId: { $in: driverIds } }).select("userId vehicleType").lean(),
        ]);

        const storeProfileMap = new Map(storeProfiles.map((p) => [p.userId.toString(), p]));
        const driverProfileMap = new Map(driverProfiles.map((p) => [p.userId.toString(), p]));

        const storeApplications = pendingStoreUsers.map((u) => ({
            id: u._id.toString(),
            name: storeProfileMap.get(u._id.toString())?.storeName || u.name,
            category: "Store",
            submittedDate: u.createdAt,
        }));

        const driverApplications = pendingDriverUsers.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            category: driverProfileMap.get(u._id.toString())?.vehicleType || "Driver",
            submittedDate: u.createdAt,
        }));

        const attentionItems = [];
        if (stalePendingStores > 0) {
            attentionItems.push({
                id: "stale-stores",
                severity: "warning",
                type: "stores",
                title: `${stalePendingStores} Store Application${stalePendingStores === 1 ? "" : "s"} Waiting > 48h`,
                description: "Pending review longer than the 48-hour SLA.",
                actionLabel: "Review Applications",
            });
        }
        if (stalePendingDrivers > 0) {
            attentionItems.push({
                id: "stale-drivers",
                severity: "warning",
                type: "drivers",
                title: `${stalePendingDrivers} Driver Application${stalePendingDrivers === 1 ? "" : "s"} Waiting > 48h`,
                description: "Pending review longer than the 48-hour SLA.",
                actionLabel: "Review Applications",
            });
        }
        if (stuckOrders > 0) {
            attentionItems.push({
                id: "stuck-orders",
                severity: "critical",
                type: "orders",
                title: `${stuckOrders} Order${stuckOrders === 1 ? "" : "s"} Stuck > 45 min`,
                description: "Not yet delivered or cancelled — may need a manual check.",
                actionLabel: "View Orders",
            });
        }

        return res.status(200).json({
            success: true,
            attentionItems,
            approvalQueue: {
                stores: storeApplications,
                drivers: driverApplications,
            },
        });
    } catch (err) {
        console.error("[getActionRail]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

module.exports = {
    getDashboardKpis,
    getOperationsIntelligence,
    getRecentOrders,
    getActionRail,
};