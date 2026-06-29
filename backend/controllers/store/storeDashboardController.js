const Order = require("../../models/shared/order");
const Product = require("../../models/store/product");
const { resolveStoreProfile } = require("../../services/storeProfileService");
const { getLiveStoreStatus } = require("./storeStatus");

// Products at or below this stock level count as "low stock" on the
// dashboard alert. Adjust here if you want this configurable per store
// later (e.g. a field on StoreProfile) instead of a global constant.
const LOW_STOCK_THRESHOLD = 5;

// Statuses that still count as "pending" from the store's point of view —
// i.e. the store still owes the customer an action (accept/pack/hand off).
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

// ─── GET /api/store/dashboard/summary ─────────────────────────────────────────
const getDashboardSummary = async (req, res) => {
  try {
    const store = await resolveStoreProfile(req.user.userID);
    const storeId = store._id;

    const todayStart = startOfToday();
    const yesterdayStart = startOfYesterday();

    // ── Today's orders + revenue, and yesterday's for trend comparison ──────
    const [todaysOrders, yesterdaysOrders, pendingOrders, lowStockProducts] =
      await Promise.all([
        Order.find({ storeId, createdAt: { $gte: todayStart } }).select(
          "orderNumber totalAmount orderStatus createdAt recipientName products"
        ),
        Order.find({
          storeId,
          createdAt: { $gte: yesterdayStart, $lt: todayStart },
        }).select("totalAmount"),
        Order.find({ storeId, orderStatus: { $in: PENDING_STATUSES } }).countDocuments(),
        Product.find({
          storeId,
          stockQuantity: { $lte: LOW_STOCK_THRESHOLD },
        }).select("productName stockQuantity"),
      ]);

    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const yesterdaysRevenue = yesterdaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const revenueTrendPct =
      yesterdaysRevenue === 0
        ? null
        : Math.round(((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 1000) / 10;

    const ordersTrendPct =
      yesterdaysOrders.length === 0
        ? null
        : Math.round(
            ((todaysOrders.length - yesterdaysOrders.length) / yesterdaysOrders.length) * 1000
          ) / 10;

    // ── Best selling today: aggregate quantity sold per product from
    //    today's orders only ────────────────────────────────────────────────
    const soldByProduct = new Map(); // productId -> { name, sold }
    for (const order of todaysOrders) {
      for (const item of order.products || []) {
        const key = item.productId.toString();
        const entry = soldByProduct.get(key) || { name: item.productName, sold: 0 };
        entry.sold += item.quantity;
        soldByProduct.set(key, entry);
      }
    }
    const bestSelling = Array.from(soldByProduct.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
    const maxSold = bestSelling.length > 0 ? bestSelling[0].sold : 0;

    // ── Incoming orders: most recent few, regardless of status ──────────────
    const incomingOrders = [...todaysOrders]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((o) => ({
        id: o.orderNumber,
        customer: o.recipientName,
        total: o.totalAmount,
        status: o.orderStatus,
      }));

    const liveStatus = getLiveStoreStatus(store);

    return res.status(200).json({
      success: true,
      store: {
        storeName: store.storeName,
        visibility: liveStatus.status, // "OPEN" | "CLOSED" | "BUSY"
        isManuallyClosed: store.isManuallyClosed,
        operatingHours: store.operatingHours,
      },
      kpis: {
        todaysOrders: { value: todaysOrders.length, trendPct: ordersTrendPct },
        todaysRevenue: { value: todaysRevenue, trendPct: revenueTrendPct },
        pendingOrders: { value: pendingOrders },
        lowStockAlerts: { value: lowStockProducts.length },
      },
      incomingOrders,
      bestSelling: bestSelling.map((p) => ({ name: p.name, sold: p.sold, maxSold })),
      lowStockProducts: lowStockProducts.map((p) => ({
        name: p.productName,
        stockQuantity: p.stockQuantity,
      })),
    });
  } catch (err) {
    console.error("GET DASHBOARD SUMMARY ERROR:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getDashboardSummary };