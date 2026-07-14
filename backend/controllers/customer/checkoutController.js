const Cart = require("../../models/customer/cart");
const StoreProfile = require("../../models/store/storeProfile");
const { resolveCustomerProfile } = require("../../services/customerProfileService");
const { computeBill, PricingError, MIN_ORDER_VALUE } = require("../../services/pricingService");
const walletService = require("../../services/walletService");
const { createOrderFromCart } = require("../../services/orderCreationService");

// resolveCustomerProfile returns the full profile doc, not just the id —
// callers below need savedAddresses/defaultAddress/codAllowed too
const resolveCustomerProfileDoc = async (req) => {
    return await resolveCustomerProfile(req.user.userID);
};

// GET /api/customer/checkout/summary?addressId=...
// returns cart contents, addresses, wallet balance, and computed totals for
// whichever address is selected. Delivery charge depends on store -> address
// distance, so totals can only be computed once an address is known.
const getCheckoutSummary = async (req, res) => {
    try {
        const profile = await resolveCustomerProfileDoc(req);
        const { addressId } = req.query;

        const cart = await Cart.findOne({ customerId: profile._id })
            .populate({
                path: "products.productId",
                select: "productName images price unit availabilityStatus stockQuantity storeId",
                populate: { path: "storeId", select: "storeName logoUrl" },
            })
            .lean();

        const walletBalance = await walletService.getBalance(profile._id);

        if (!cart || cart.products.length === 0) {
            return res.status(200).json({
                success: true,
                cart: { products: [], totalAmount: 0 },
                addresses: profile.savedAddresses,
                defaultAddressId: profile.defaultAddress,
                codAllowed: profile.codAllowed,
                walletBalance,
                totals: null,
            });
        }

        const subtotal = cart.totalAmount;

        const resolvedAddressId = addressId || profile.defaultAddress || profile.savedAddresses[0]?._id;
        const address = resolvedAddressId ? profile.savedAddresses.id(resolvedAddressId) : null;

        let totals = null;
        let pricingError = null;

        if (address) {
            // all cart items share one store (enforced at add-to-cart time) —
            // grab it from the first populated product
            const storeId = cart.products[0]?.productId?.storeId?._id;
            const storeProfile = storeId
                ? await StoreProfile.findById(storeId).select("coordinates").lean()
                : null;

            try {
                const bill = computeBill({
                    subtotal,
                    storeCoordinates: storeProfile?.coordinates,
                    addressCoordinates: address.coordinates,
                });
                totals = {
                    productTotal: bill.subtotal,
                    deliveryCharge: bill.deliveryCharge,
                    packagingFee: bill.handlingFee,
                    grandTotal: bill.totalAmount,
                    distanceKm: bill.distanceKm,
                    freeDeliveryApplied: bill.freeDeliveryApplied,
                };
            } catch (err) {
                if (err instanceof PricingError) {
                    pricingError = err.message;
                } else {
                    throw err;
                }
            }
        }

        return res.status(200).json({
            success: true,
            cart,
            addresses: profile.savedAddresses,
            defaultAddressId: profile.defaultAddress,
            codAllowed: profile.codAllowed,
            walletBalance,
            totals,
            pricingError,
            minOrderValue: MIN_ORDER_VALUE,
        });
    } catch (err) {
        console.error("GET CHECKOUT SUMMARY ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// POST /api/customer/checkout/place-order — COD only.
// ONLINE orders go through paymentController.verifyPayment instead (or get
// created immediately if the wallet fully covers the total).
const placeOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod } = req.body;

        if (!addressId) {
            return res.status(400).json({ success: false, message: "addressId is required." });
        }
        if (paymentMethod !== "COD") {
            return res.status(400).json({
                success: false,
                message: "Use /api/customer/payment/create-order for online payment.",
            });
        }

        const profile = await resolveCustomerProfileDoc(req);
        if (!profile.codAllowed) {
            return res.status(403).json({
                success: false,
                message: "Cash on Delivery is not available for your account. Please contact support.",
            });
        }

        const { order } = await createOrderFromCart({
            userId: req.user.userID,
            addressId,
            paymentMethod: "COD",
            paymentStatus: "PENDING",
        });

        return res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            order,
        });
    } catch (err) {
        console.error("PLACE ORDER ERROR:", err);
        const status = err.status || (err.message?.startsWith("Insufficient stock") ? 400 : 500);
        return res.status(status).json({
            success: false,
            message: status === 500 ? "Internal server error." : err.message,
        });
    }
};

module.exports = {
    getCheckoutSummary,
    placeOrder,
};