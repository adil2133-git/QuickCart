const mongoose = require("mongoose");
const Cart = require("../../models/customer/cart");
const Product = require("../../models/store/product");
const { resolveCustomerProfile } = require("../../services/customerProfileService");
const Order = require("../../models/shared/order");
const User = require("../../models/shared/user");
const CustomerProfile = require("../../models/customer/customerProfile");
const StoreProfile = require("../../models/store/storeProfile");
const { sendOrderPlacedEmail, sendNewOrderStoreEmail } = require("../../services/mailService");

const DELIVERY_CHARGE = 30;
const PACKAGING_FEE = 15;

// resolveCustomerProfile returns the full profile doc (not just the id) —
// callers below rely on savedAddresses/defaultAddress/codAllowed too.
const resolveCustomerProfileDoc = async (req) => {
    return await resolveCustomerProfile(req.user.userID);
};

// ─── Helper: flatten a savedAddress sub-doc into the string Order expects ─────
const formatAddress = (addr) => {
    if (!addr) return "";
    return addr.address;
};

// ─── GET /api/customer/checkout/summary ──────────────────────────────────────
// Returns everything the checkout page needs in one call: cart contents,
// the resolved default address, and computed totals. No writes happen here.
const getCheckoutSummary = async (req, res) => {
    try {
        const profile = await resolveCustomerProfileDoc(req);

        const cart = await Cart.findOne({ customerId: profile._id })
            .populate({
                path: "products.productId",
                select: "productName images price unit availabilityStatus stockQuantity storeId",
                populate: { path: "storeId", select: "storeName logoUrl" },
            })
            .lean();

        if (!cart || cart.products.length === 0) {
            return res.status(200).json({
                success: true,
                cart: { products: [], totalAmount: 0 },
                addresses: profile.savedAddresses,
                defaultAddressId: profile.defaultAddress,
                codAllowed: profile.codAllowed,
                totals: null,
            });
        }

        const subtotal = cart.totalAmount;
        const totals = {
            productTotal: subtotal,
            deliveryCharge: DELIVERY_CHARGE,
            packagingFee: PACKAGING_FEE,
            grandTotal: subtotal + DELIVERY_CHARGE + PACKAGING_FEE,
        };

        return res.status(200).json({
            success: true,
            cart,
            addresses: profile.savedAddresses,
            defaultAddressId: profile.defaultAddress,
            codAllowed: profile.codAllowed,
            totals,
        });
    } catch (err) {
        console.error("GET CHECKOUT SUMMARY ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── POST /api/customer/checkout/place-order ─────────────────────────────────
// Body: { addressId, paymentMethod, deliveryInstructions? }
// COD only for now. Validates stock at order time, snapshots names/prices,
// creates the Order, decrements stock, clears the cart — wrapped in a
// transaction so a partial failure can't decrement stock without an order.
const placeOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { addressId, paymentMethod, deliveryInstructions } = req.body;

        if (!addressId) {
            return res.status(400).json({ success: false, message: "addressId is required." });
        }
        if (paymentMethod !== "COD") {
            return res.status(400).json({
                success: false,
                message: "Only Cash on Delivery is supported right now.",
            });
        }

        const profile = await resolveCustomerProfileDoc(req);

        if (!profile.codAllowed) {
            return res.status(403).json({
                success: false,
                message: "Cash on Delivery is not available for your account. Please contact support.",
            });
        }

        const address = profile.savedAddresses.id(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found." });
        }

        const user = await User.findById(req.user.userID).select("name phone email").lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const cart = await Cart.findOne({ customerId: profile._id });
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty." });
        }

        // Re-fetch products fresh — never trust the price/quantity cached on the cart
        const productIds = cart.products.map((p) => p.productId);
        const products = await Product.find({ _id: { $in: productIds } })
            .select("productName price availabilityStatus stockQuantity storeId")
            .lean();

        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        const orderProducts = [];
        for (const item of cart.products) {
            const product = productMap.get(item.productId.toString());

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "One of the items in your cart is no longer available.",
                });
            }
            if (product.availabilityStatus !== "AVAILABLE" && product.availabilityStatus !== undefined) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is currently unavailable.`,
                });
            }
            if (item.quantity > product.stockQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stockQuantity} unit(s) of ${product.productName} available.`,
                });
            }

            orderProducts.push({
                productId: product._id,
                productName: product.productName,
                quantity: item.quantity,
                price: product.price, // always the current price, not the cart's cached price
            });
        }

        // All items must belong to a single store — re-derived here rather than trusted
        const storeId = products[0].storeId;
        const mismatched = products.some((p) => p.storeId.toString() !== storeId.toString());
        if (mismatched) {
            return res.status(409).json({
                success: false,
                message: "Cart contains items from multiple stores. Please fix your cart before checking out.",
            });
        }

        const subtotal = orderProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
        const totalAmount = subtotal + DELIVERY_CHARGE + PACKAGING_FEE;

        let createdOrder;

        await session.withTransaction(async () => {
            // Decrement stock for each product
            for (const item of orderProducts) {
                const updated = await Product.findOneAndUpdate(
                    { _id: item.productId, stockQuantity: { $gte: item.quantity } },
                    { $inc: { stockQuantity: -item.quantity } },
                    { session, returnDocument: "after" }
                );
                if (!updated) {
                    throw new Error(`Insufficient stock for ${item.productName}.`);
                }
            }

            createdOrder = await Order.create(
                [
                    {
                        customerId: profile._id,
                        storeId,
                        products: orderProducts,
                        subtotal,
                        deliveryCharge: DELIVERY_CHARGE + PACKAGING_FEE,
                        totalAmount,
                        paymentMethod: "COD",
                        paymentStatus: "PENDING",
                        deliveryAddress: formatAddress(address),
                        deliveryCoordinates: address.coordinates
                            ? { lat: address.coordinates.lat, lng: address.coordinates.lng }
                            : undefined,
                        recipientName: user.name,
                        recipientPhone: user.phone,
                    },
                ],
                { session }
            );

            await Cart.findOneAndUpdate(
                { customerId: profile._id },
                { $set: { products: [], totalAmount: 0 } },
                { session }
            );

            await CustomerProfile.findByIdAndUpdate(
                profile._id,
                { $inc: { totalOrders: 1 } },
                { session }
            );
        });

        const order = createdOrder[0];

        const { emitToStore } = require("../../socket");
        emitToStore(storeId, "order:new", {
            id: order._id.toString(),
            orderNumber: order.orderNumber,
            recipientName: order.recipientName,
            totalAmount: order.totalAmount,
            itemCount: order.products.reduce((sum, p) => sum + p.quantity, 0),
            paymentMethod: order.paymentMethod,
            orderStatus: order.orderStatus,
            placedAt: order.createdAt,
        });

        // Fire-and-forget order emails — don't hold up the customer's response.
        StoreProfile.findById(storeId)
            .populate("userId", "name email")
            .lean()
            .then((storeProfile) => {
                sendOrderPlacedEmail({
                    toEmail: user.email,
                    customerName: user.name,
                    order,
                    storeName: storeProfile?.storeName || "the store",
                }).catch(() => {});

                if (storeProfile?.userId?.email) {
                    sendNewOrderStoreEmail({
                        toEmail: storeProfile.userId.email,
                        storeName: storeProfile.storeName,
                        order,
                    }).catch(() => {});
                }
            })
            .catch((err) => console.error("[order emails] Failed to resolve store:", err));

        return res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            order,
        });
    } catch (err) {
        console.error("PLACE ORDER ERROR:", err);
        if (err.message?.startsWith("Insufficient stock")) {
            return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, message: "Internal server error." });
    } finally {
        session.endSession();
    }
};

module.exports = {
    getCheckoutSummary,
    placeOrder,
};