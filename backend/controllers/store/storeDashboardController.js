const Order = require("../../models/shared/order");
const Product = require("../../models/store/product");
const { resolveStoreProfile } = require("../../services/storeProfileService");
const { getLiveStoreStatus } = require("../../utils/storeStatus");

// keep in sync with LOW_STOCK_THRESHOLD on the frontend (store/lib/dashboardUtils.ts)
const LOW_STOCK_THRESHOLD = 10;

const PENDING_STATUSES = ["PENDING", "ACCEPTED", "PACKING", "READY_FOR_PICKUP"];

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfYesterday() {
    const d = startOfToday();
    d.setDate(d.getDate() - 1);
    return d;
}

function pctChange(today, yesterday) {
    if (yesterday === 0) return null;
    return Math.round(((today - yesterday) / yesterday) * 1000) / 10;
}

// builds a "HH:mm – HH:mm" label for today, or "Closed today" / "Hours not set"
function formatTodaysHours(operatingHours = []) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = dayNames[new Date().getDay()];
    const entry = operatingHours.find((h) => h.day === today);
    if (!entry || entry.isClosed) return "Closed today";
    if (!entry.openTime || !entry.closeTime) return "Hours not set";
    return `${entry.openTime} – ${entry.closeTime}`;
}

// GET /api/store/dashboard/summary
const getDashboardSummary = async (req, res) => {
    try {
        const store = await resolveStoreProfile(req.user.userID);
        const storeId = store._id;

        const todayStart = startOfToday();
        const yesterdayStart = startOfYesterday();

        const [todaysOrders, yesterdaysOrders, pendingOrdersCount, lowStockProducts] =
            await Promise.all([
                Order.find({ storeId, createdAt: { $gte: todayStart } }).select(
                    "orderNumber totalAmount orderStatus createdAt recipientName products"
                ),
                Order.find({
                    storeId,
                    createdAt: { $gte: yesterdayStart, $lt: todayStart },
                }).select("totalAmount orderStatus"),
                Order.countDocuments({ storeId, orderStatus: { $in: PENDING_STATUSES } }),
                Product.find({
                    storeId,
                    availabilityStatus: "AVAILABLE",
                    stockQuantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
                }).select("productName stockQuantity"),
            ]);

        // cancelled orders were never actually earned — excluded from revenue,
        // but still counted in todaysOrders, which tracks order volume, not money
        const todaysRevenue = todaysOrders
            .filter((o) => o.orderStatus !== "CANCELLED")
            .reduce((sum, o) => sum + o.totalAmount, 0);
        const yesterdaysRevenue = yesterdaysOrders
            .filter((o) => o.orderStatus !== "CANCELLED")
            .reduce((sum, o) => sum + o.totalAmount, 0);

        // aggregate quantity sold per product, today only
        const soldByProduct = new Map(); // productId -> { productName, unitsSold }
        for (const order of todaysOrders) {
            for (const item of order.products || []) {
                const key = item.productId.toString();
                const entry = soldByProduct.get(key) || {
                    productId: key,
                    productName: item.productName,
                    unitsSold: 0,
                };
                entry.unitsSold += item.quantity;
                soldByProduct.set(key, entry);
            }
        }
        const bestSelling = Array.from(soldByProduct.values())
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 5);

        const incomingOrders = [...todaysOrders]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 8)
            .map((o) => ({
                _id: o._id.toString(),
                orderNumber: o.orderNumber,
                customerName: o.recipientName,
                totalAmount: o.totalAmount,
                orderStatus: o.orderStatus,
            }));

        const liveStatus = getLiveStoreStatus(store);

        return res.status(200).json({
            success: true,
            summary: {
                storeName: store.storeName,
                status: liveStatus.status, // "OPEN" | "CLOSED" | "BUSY"
                todaysHours: formatTodaysHours(store.operatingHours),
                stats: {
                    todaysOrders: todaysOrders.length,
                    todaysOrdersChangePct: pctChange(todaysOrders.length, yesterdaysOrders.length),
                    todaysRevenue,
                    todaysRevenueChangePct: pctChange(todaysRevenue, yesterdaysRevenue),
                    pendingOrdersCount,
                    lowStockCount: lowStockProducts.length,
                },
                incomingOrders,
                bestSelling,
                lowStockProducts: lowStockProducts.map((p) => ({
                    productId: p._id.toString(),
                    productName: p.productName,
                    stockQuantity: p.stockQuantity,
                })),
            },
        });
    } catch (err) {
        console.error("GET DASHBOARD SUMMARY ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { getDashboardSummary };