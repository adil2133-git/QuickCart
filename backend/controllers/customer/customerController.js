const CustomerProfile = require("../../models/customer/customerProfile");
const StoreProfile = require("../../models/store/storeProfile");
const Product = require("../../models/store/product");
const Category = require("../../models/store/category");
const User = require("../../models/shared/user")
const { getLiveStoreStatus, distanceInKm } = require("../store/storeStatus");


// ─── GET /api/customer/profile ────────────────────────────────────────────────
// Returns the customer's profile (saved addresses + default address).
// Creates a profile automatically if this is the customer's first visit.
const getProfile = async (req, res) => {
    try {
        let profile = await CustomerProfile.findOne({ userId: req.user.userID });

        if (!profile) {
            profile = await CustomerProfile.create({ userId: req.user.userID });
        }

        return res.status(200).json({ success: true, profile });
    } catch (err) {
        console.error("GET PROFILE ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── POST /api/customer/address ───────────────────────────────────────────────
// Adds a new saved address. If it's the first address, sets it as default.
// Body: { label, address, coordinates: { lat, lng } }
const addAddress = async (req, res) => {
    try {
        const { label, address, coordinates } = req.body;

        if (!address || !coordinates?.lat || !coordinates?.lng) {
            return res.status(400).json({ success: false, message: "Address and coordinates are required" });
        }

        let profile = await CustomerProfile.findOne({ userId: req.user.userID });
        if (!profile) {
            profile = await CustomerProfile.create({ userId: req.user.userID });
        }

        const newAddress = { label: label || "Home", address, coordinates };
        profile.savedAddresses.push(newAddress);

        // Auto-set as default if it's the first address
        if (profile.savedAddresses.length === 1) {
            profile.defaultAddress = profile.savedAddresses[0]._id;
        }

        await profile.save();

        const added = profile.savedAddresses[profile.savedAddresses.length - 1];

        return res.status(201).json({
            success: true,
            message: "Address added",
            address: added,
            defaultAddress: profile.defaultAddress,
        });
    } catch (err) {
        console.error("ADD ADDRESS ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── PATCH /api/customer/address/:id/default ─────────────────────────────────
// Sets a saved address as the default delivery address.
const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const profile = await CustomerProfile.findOne({ userId: req.user.userID });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found" });
        }

        const exists = profile.savedAddresses.id(id);
        if (!exists) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        profile.defaultAddress = id;
        await profile.save();

        return res.status(200).json({ success: true, message: "Default address updated" });
    } catch (err) {
        console.error("SET DEFAULT ADDRESS ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── DELETE /api/customer/address/:id ────────────────────────────────────────
// Removes a saved address. If it was the default, clears defaultAddress.
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const profile = await CustomerProfile.findOne({ userId: req.user.userID });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found" });
        }

        const addrIndex = profile.savedAddresses.findIndex(
            (a) => a._id.toString() === id
        );
        if (addrIndex === -1) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        profile.savedAddresses.splice(addrIndex, 1);

        // Clear default if deleted address was the default
        if (profile.defaultAddress?.toString() === id) {
            profile.defaultAddress = profile.savedAddresses[0]?._id || null;
        }

        await profile.save();

        return res.status(200).json({
            success: true,
            message: "Address deleted",
            defaultAddress: profile.defaultAddress,
        });
    } catch (err) {
        console.error("DELETE ADDRESS ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET /api/customer/stores/nearby ─────────────────────────────────────────
// Query: ?lat=&lng=&radius= (radius in km, default 10)
// Uses the 2dsphere index on StoreProfile.coordinates.
// Only returns ACTIVE (approved, not manually closed) stores.
const getNearbyStores = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radiusKm = parseFloat(req.query.radius) || 10;

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ success: false, message: "lat and lng are required" });
        }

        // 1. Fetch all stores whose owning User account is ACTIVE (approved, not suspended)
        const approvedUsers = await User.find({ role: "STORE", status: "ACTIVE" }).select("_id").lean();
        const approvedUserIds = approvedUsers.map((u) => u._id);

        // 2. Fetch their StoreProfiles — only ones with coordinates set
        const stores = await StoreProfile.find({
            userId: { $in: approvedUserIds },
            "coordinates.lat": { $ne: 0 },
            "coordinates.lng": { $ne: 0 },
        })
            .select("storeName ownerName address coordinates logoUrl averageRating totalOrders operatingHours isManuallyClosed storeStatus")
            .lean();

        // 3. Filter by live status + distance
        const nearby = stores
            .map((store) => {
                const liveStatus = getLiveStoreStatus(store);
                const distKm = distanceInKm({ lat, lng }, store.coordinates);
                return { ...store, liveStatus: liveStatus.status, distanceKm: distKm };
            })
            .filter((store) => {
                if (store.distanceKm === null) return false;
                if (store.distanceKm > radiusKm) return false;
                return true;
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .map((store) => ({
                _id: store._id,
                storeName: store.storeName,
                ownerName: store.ownerName,
                address: store.address,
                coordinates: store.coordinates,
                logoUrl: store.logoUrl,
                averageRating: store.averageRating,
                totalOrders: store.totalOrders,
                status: store.liveStatus,
                distanceKm: Math.round(store.distanceKm * 10) / 10,
            }));

        return res.status(200).json({ success: true, stores: nearby });
    } catch (err) {
        console.error("GET NEARBY STORES ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET /api/customer/products/popular ──────────────────────────────────────
// Returns available products sorted by stock descending (proxy for popularity
// until order tracking is built). Limit 8.
const getPopularProducts = async (req, res) => {
    try {
        const products = await Product.find({ isAvailable: true })
            .sort({ stock: -1 })
            .limit(8)
            .populate("storeId", "storeName")
            .populate("categoryId", "name image")
            .lean();

        return res.status(200).json({ success: true, products });
    } catch (err) {
        console.error("GET POPULAR PRODUCTS ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET /api/customer/products/trending ─────────────────────────────────────
// Returns the most recently added available products. Limit 8.
const getTrendingProducts = async (req, res) => {
    try {
        const products = await Product.find({ isAvailable: true })
            .sort({ createdAt: -1 })
            .limit(8)
            .populate("storeId", "storeName")
            .populate("categoryId", "name image")
            .lean();

        return res.status(200).json({ success: true, products });
    } catch (err) {
        console.error("GET TRENDING PRODUCTS ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET /api/customer/categories ────────────────────────────────────────────
// Public — no auth needed. Re-exported here so the customer app has a single
// base URL (/api/customer/...) without importing the store controller.
const getCategories = async (req, res) => {
    try {
        const Category = require("../../models/store/category");
        const categories = await Category.find().sort({ name: 1 }).lean();
        return res.status(200).json({ success: true, categories });
    } catch (err) {
        console.error("GET CATEGORIES ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getProfile,
    addAddress,
    setDefaultAddress,
    deleteAddress,
    getNearbyStores,
    getPopularProducts,
    getTrendingProducts,
    getCategories,
};