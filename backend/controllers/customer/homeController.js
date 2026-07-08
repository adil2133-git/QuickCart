const Order = require("../../models/shared/order");
const Product = require("../../models/store/product");
const { resolveCustomerProfile } = require("../../services/customerProfileService");

// GET /api/customer/home/recent-orders
// Returns the last 5 distinct products the customer ordered
const getRecentlyOrdered = async (req, res) => {
    try {
        const profile = await resolveCustomerProfile(req.user.userID);

        const recentOrders = await Order.find({
            customerId: profile._id,
            orderStatus: { $nin: ["CANCELLED"] },
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Flatten all products from recent orders, deduplicate by productId
        const seen = new Set();
        const productIds = [];
        for (const order of recentOrders) {
            for (const item of order.products ?? []) {
                const id = item.productId?.toString();
                if (id && !seen.has(id)) {
                    seen.add(id);
                    productIds.push(item.productId);
                }
                if (productIds.length >= 5) break;
            }
            if (productIds.length >= 5) break;
        }

        if (productIds.length === 0) {
            return res.status(200).json({ success: true, products: [] });
        }

        const products = await Product.find({
            _id: { $in: productIds },
            availabilityStatus: "AVAILABLE",
        })
            .populate("storeId", "storeName")
            .populate("categoryId", "categoryName image")
            .select("productName price images unit stockQuantity storeId categoryId")
            .lean();

        // Preserve the "most recently ordered first" order (Mongo doesn't
        // guarantee $in ordering matches productIds ordering).
        const order = new Map(productIds.map((id, i) => [id.toString(), i]));
        products.sort((a, b) => (order.get(a._id.toString()) ?? 0) - (order.get(b._id.toString()) ?? 0));

        return res.status(200).json({ success: true, products });
    } catch (err) {
        console.error("[getRecentlyOrdered]", err);
        return res.status(500).json({ success: false, message: "Failed to load recent orders." });
    }
};

module.exports = { getRecentlyOrdered };