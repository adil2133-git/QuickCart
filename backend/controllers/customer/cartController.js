const Cart = require("../../models/customer/cart");
const Product = require("../../models/store/product");
const { resolveCustomerProfile } = require("../../services/customerProfileService");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Helper: resolve customerId from the JWT user ─────────────────────────────
const resolveCustomerId = async (req) => {
    const profile = await resolveCustomerProfile(req.user.userID);
    return profile._id;
};

// ─── Helper: recalculate totalAmount ─────────────────────────────────────────
const recalcTotal = (products) =>
    products.reduce((sum, item) => sum + item.price * item.quantity, 0);

// ─── GET /api/customer/cart ───────────────────────────────────────────────────
// Returns the customer's cart, fully populated with product + store info.
const getCart = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);
        if (!customerId) {
            return res.status(404).json({ success: false, message: "Customer profile not found." });
        }

        const cart = await Cart.findOne({ customerId })
            .populate({
                path: "products.productId",
                select: "productName images price unit availabilityStatus stockQuantity storeId",
                populate: { path: "storeId", select: "storeName logoUrl" },
            })
            .lean();

        if (!cart) {
            return res.status(200).json({ success: true, cart: { products: [], totalAmount: 0 } });
        }

        return res.status(200).json({ success: true, cart });
    } catch (err) {
        console.error("GET CART ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── POST /api/customer/cart/add ─────────────────────────────────────────────
// Body: { productId, quantity }
// Multi-store logic: if the cart already has items from a DIFFERENT store,
// return a 409 conflict so the frontend can prompt the user to clear & replace.
const addToCart = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);
        if (!customerId) {
            return res.status(404).json({ success: false, message: "Customer profile not found." });
        }

        const { productId, quantity = 1 } = req.body;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ success: false, message: "Invalid productId." });
        }
        if (typeof quantity !== "number" || quantity < 1) {
            return res.status(400).json({ success: false, message: "quantity must be >= 1." });
        }

        // Verify the product exists and is available
        const product = await Product.findById(productId)
            .populate("storeId", "storeName logoUrl")
            .lean();

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        if (product.availabilityStatus === "OUT_OF_STOCK") {
            return res.status(400).json({ success: false, message: "Product is out of stock." });
        }
        if (product.availabilityStatus === "HIDDEN") {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        if (quantity > product.stockQuantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stockQuantity} unit(s) available.`,
            });
        }

        let cart = await Cart.findOne({ customerId });

        if (!cart) {
            // Brand-new cart
            cart = await Cart.create({
                customerId,
                products: [{ productId, quantity, price: product.price }],
                totalAmount: product.price * quantity,
            });
        } else {
            // ── Multi-store conflict check ────────────────────────────────────
            if (cart.products.length > 0) {
                // Get storeId of the first item already in the cart
                const firstProduct = await Product.findById(cart.products[0].productId)
                    .select("storeId")
                    .lean();

                const cartStoreId = firstProduct?.storeId?.toString();
                const incomingStoreId = product.storeId._id.toString();

                if (cartStoreId && cartStoreId !== incomingStoreId) {
                    // Conflict — ask frontend to decide
                    return res.status(409).json({
                        success: false,
                        conflict: true,
                        message: "Your cart has items from a different store.",
                        cartStoreName: firstProduct
                            ? (await Product.findById(cart.products[0].productId)
                                .populate("storeId", "storeName")
                                .lean())?.storeId?.storeName
                            : "another store",
                        newStoreName: product.storeId.storeName,
                        productId,
                        quantity,
                    });
                }
            }

            // Same store — upsert the item
            const existingIndex = cart.products.findIndex(
                (p) => p.productId.toString() === productId
            );

            if (existingIndex > -1) {
                const newQty = cart.products[existingIndex].quantity + quantity;
                if (newQty > product.stockQuantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Only ${product.stockQuantity} unit(s) available. You already have ${cart.products[existingIndex].quantity} in your cart.`,
                    });
                }
                cart.products[existingIndex].quantity = newQty;
                cart.products[existingIndex].price = product.price; // always use latest price
            } else {
                cart.products.push({ productId, quantity, price: product.price });
            }

            cart.totalAmount = recalcTotal(cart.products);
            await cart.save();
        }

        // Return populated cart
        const populated = await Cart.findById(cart._id)
            .populate({
                path: "products.productId",
                select: "productName images price unit availabilityStatus stockQuantity storeId",
                populate: { path: "storeId", select: "storeName logoUrl" },
            })
            .lean();

        return res.status(200).json({ success: true, cart: populated });
    } catch (err) {
        console.error("ADD TO CART ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── PATCH /api/customer/cart/item/:productId ─────────────────────────────────
// Body: { quantity }  — set absolute quantity (not delta).
// Passing quantity: 0 removes the item.
const updateCartItem = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);
        if (!customerId) {
            return res.status(404).json({ success: false, message: "Customer profile not found." });
        }

        const { productId } = req.params;
        const { quantity } = req.body;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ success: false, message: "Invalid productId." });
        }
        if (typeof quantity !== "number" || quantity < 0) {
            return res.status(400).json({ success: false, message: "quantity must be >= 0." });
        }

        const cart = await Cart.findOne({ customerId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        const itemIndex = cart.products.findIndex(
            (p) => p.productId.toString() === productId
        );
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Item not found in cart." });
        }

        if (quantity === 0) {
            cart.products.splice(itemIndex, 1);
        } else {
            // Validate stock
            const product = await Product.findById(productId).select("stockQuantity price").lean();
            if (product && quantity > product.stockQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stockQuantity} unit(s) available.`,
                });
            }
            cart.products[itemIndex].quantity = quantity;
            if (product) cart.products[itemIndex].price = product.price;
        }

        cart.totalAmount = recalcTotal(cart.products);
        await cart.save();

        const populated = await Cart.findById(cart._id)
            .populate({
                path: "products.productId",
                select: "productName images price unit availabilityStatus stockQuantity storeId",
                populate: { path: "storeId", select: "storeName logoUrl" },
            })
            .lean();

        return res.status(200).json({ success: true, cart: populated });
    } catch (err) {
        console.error("UPDATE CART ITEM ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── DELETE /api/customer/cart/item/:productId ────────────────────────────────
// Removes a single item from the cart.
const removeFromCart = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);
        if (!customerId) {
            return res.status(404).json({ success: false, message: "Customer profile not found." });
        }

        const { productId } = req.params;

        if (!isValidObjectId(productId)) {
            return res.status(400).json({ success: false, message: "Invalid productId." });
        }

        const cart = await Cart.findOne({ customerId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        const before = cart.products.length;
        cart.products = cart.products.filter(
            (p) => p.productId.toString() !== productId
        );

        if (cart.products.length === before) {
            return res.status(404).json({ success: false, message: "Item not found in cart." });
        }

        cart.totalAmount = recalcTotal(cart.products);
        await cart.save();

        const populated = await Cart.findById(cart._id)
            .populate({
                path: "products.productId",
                select: "productName images price unit availabilityStatus stockQuantity storeId",
                populate: { path: "storeId", select: "storeName logoUrl" },
            })
            .lean();

        return res.status(200).json({ success: true, cart: populated });
    } catch (err) {
        console.error("REMOVE FROM CART ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// ─── DELETE /api/customer/cart ────────────────────────────────────────────────
// Clears the entire cart (used when customer confirms store-switch).
const clearCart = async (req, res) => {
    try {
        const customerId = await resolveCustomerId(req);
        if (!customerId) {
            return res.status(404).json({ success: false, message: "Customer profile not found." });
        }

        await Cart.findOneAndUpdate(
            { customerId },
            { $set: { products: [], totalAmount: 0 } },
            { upsert: true }
        );

        return res.status(200).json({ success: true, message: "Cart cleared.", cart: { products: [], totalAmount: 0 } });
    } catch (err) {
        console.error("CLEAR CART ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};