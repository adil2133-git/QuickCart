const CustomerProfile = require("../../models/customer/customerProfile");
const StoreProfile = require("../../models/store/storeProfile");
const { resolveCustomerProfile } = require("../../services/customerProfileService");
const Product = require("../../models/store/product");
const Category = require("../../models/store/category");
const User = require("../../models/shared/user");
const { getLiveStoreStatus, distanceInKm } = require("../../utils/storeStatus");

// ─── GET /api/customer/profile ────────────────────────────────────────────────
// Returns the customer's profile (saved addresses + default address).
// Creates a profile automatically if this is the customer's first visit.
const getProfile = async (req, res) => {
    try {
        const profile = await resolveCustomerProfile(req.user.userID);

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

        const profile = await resolveCustomerProfile(req.user.userID);

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
// Uses the 2dsphere index on StoreProfile.coordinates. Only ACTIVE stores.
const getNearbyStores = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radiusKm = parseFloat(req.query.radius) || 10;

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ success: false, message: "lat and lng are required" });
        }

        // Only stores whose owning User account is ACTIVE (approved, not suspended)
        const approvedUsers = await User.find({ role: "STORE", status: "ACTIVE" }).select("_id").lean();
        const approvedUserIds = approvedUsers.map((u) => u._id);

        // Only fetch profiles that actually have coordinates set
        const stores = await StoreProfile.find({
            userId: { $in: approvedUserIds },
            "coordinates.lat": { $ne: 0 },
            "coordinates.lng": { $ne: 0 },
        })
            .select("storeName ownerName address coordinates logoUrl averageRating totalOrders operatingHours isManuallyClosed storeStatus")
            .lean();

        // Filter by live status + distance
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
// Public — no auth needed. Re-exported so the customer app has one base URL.
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        return res.status(200).json({ success: true, categories });
    } catch (err) {
        console.error("GET CATEGORIES ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET /api/customer/products/search ───────────────────────────────────────
// Real product search/browse across nearby stores — replaces the old mock
// "compare one product across stores" concept from the frontend prototype,
// which had no basis in the schema (a Product belongs to exactly one store,
// so there's no way to link "the same item" across different stores' catalogs).
// This instead returns real products, each with its own real store/price,
// filterable by search text, category, store, rating, and distance.
//
// Query params (all optional except when noted):
//   lat, lng        — customer location. If both given, distance is computed
//                      and maxDistanceKm / distance sorting become available.
//                      If omitted, distance-based filtering/sorting is skipped.
//   radius          — used only to pre-select which stores count as "nearby"
//                      when lat/lng are given (default 10 km, same as
//                      getNearbyStores) — separate from maxDistanceKm below,
//                      which further narrows the already-nearby set.
//   search          — case-insensitive substring match on productName.
//   categoryIds     — comma-separated list of category _ids.
//   storeIds        — comma-separated list of store _ids to filter to.
//   minRating       — minimum store averageRating.
//   maxDistanceKm   — maximum store distance (requires lat/lng).
//   openNow         — "true" to only include currently-open stores.
//   sortBy          — one of: "bestMatch" (default, newest first),
//                      "distance", "rating", "priceLow", "priceHigh".
//   page, limit     — pagination (default page=1, limit=20).
const searchProducts = async (req, res) => {
    try {
        const lat = req.query.lat !== undefined ? parseFloat(req.query.lat) : null;
        const lng = req.query.lng !== undefined ? parseFloat(req.query.lng) : null;
        const hasCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);
        const radiusKm = parseFloat(req.query.radius) || 10;

        const search = (req.query.search || "").trim();
        const categoryIdsParam = (req.query.categoryIds || "").trim();
        const storeIdsParam = (req.query.storeIds || "").trim();
        const minRating = req.query.minRating !== undefined ? parseFloat(req.query.minRating) : null;
        const maxDistanceKm = req.query.maxDistanceKm !== undefined ? parseFloat(req.query.maxDistanceKm) : null;
        const openNow = req.query.openNow === "true";
        const sortBy = req.query.sortBy || "bestMatch";
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

        // Step 1: approved + active stores only (same gate as getNearbyStores).
        const approvedUsers = await User.find({ role: "STORE", status: "ACTIVE" }).select("_id").lean();
        const approvedUserIds = approvedUsers.map((u) => u._id);

        let stores = await StoreProfile.find({ userId: { $in: approvedUserIds } })
            .select("storeName address coordinates logoUrl averageRating operatingHours isManuallyClosed storeStatus")
            .lean();

        // Step 2: attach live status + distance (when we have customer coords).
        stores = stores.map((store) => {
            const liveStatus = getLiveStoreStatus(store);
            const distanceKm = hasCoords ? distanceInKm({ lat, lng }, store.coordinates) : null;
            return { ...store, liveStatus: liveStatus.status, distanceKm };
        });

        // Step 3: narrow the store set by distance/rating/openNow/storeIds filters.
        if (hasCoords) {
            stores = stores.filter((s) => s.distanceKm !== null && s.distanceKm <= radiusKm);
        }
        if (maxDistanceKm !== null && !isNaN(maxDistanceKm) && hasCoords) {
            stores = stores.filter((s) => s.distanceKm !== null && s.distanceKm <= maxDistanceKm);
        }
        if (minRating !== null && !isNaN(minRating)) {
            stores = stores.filter((s) => s.averageRating >= minRating);
        }
        if (openNow) {
            stores = stores.filter((s) => s.liveStatus === "OPEN");
        }
        if (storeIdsParam) {
            const wanted = new Set(storeIdsParam.split(",").map((id) => id.trim()));
            stores = stores.filter((s) => wanted.has(String(s._id)));
        }

        const storeById = new Map(stores.map((s) => [String(s._id), s]));
        const storeIds = stores.map((s) => s._id);

        if (storeIds.length === 0) {
            return res.status(200).json({ success: true, products: [], total: 0, page, limit });
        }

        // Step 4: query products belonging only to the filtered store set.
        const productFilter = {
            storeId: { $in: storeIds },
            availabilityStatus: "AVAILABLE",
        };
        if (categoryIdsParam) {
            const wantedCategoryIds = categoryIdsParam.split(",").map((id) => id.trim());
            productFilter.categoryId = { $in: wantedCategoryIds };
        }
        if (search) productFilter.productName = { $regex: search, $options: "i" };

        let products = await Product.find(productFilter)
            .populate("categoryId", "categoryName image")
            .lean();

        // Step 5: attach each product's own store info (name/rating/distance),
        // since the frontend renders one card per product with its store inline.
        products = products.map((p) => {
            const store = storeById.get(String(p.storeId));
            return {
                ...p,
                store: store
                    ? {
                          _id: store._id,
                          storeName: store.storeName,
                          averageRating: store.averageRating,
                          distanceKm: store.distanceKm !== null ? Math.round(store.distanceKm * 10) / 10 : null,
                          status: store.liveStatus,
                      }
                    : null,
            };
        });

        // Step 6: sort.
        switch (sortBy) {
            case "distance":
                products.sort((a, b) => (a.store?.distanceKm ?? Infinity) - (b.store?.distanceKm ?? Infinity));
                break;
            case "rating":
                products.sort((a, b) => (b.store?.averageRating ?? 0) - (a.store?.averageRating ?? 0));
                break;
            case "priceLow":
                products.sort((a, b) => a.price - b.price);
                break;
            case "priceHigh":
                products.sort((a, b) => b.price - a.price);
                break;
            default: // bestMatch — newest listings first
                products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // Step 7: paginate after sort/filter so the count/page math is correct.
        const total = products.length;
        const start = (page - 1) * limit;
        const paged = products.slice(start, start + limit);

        return res.status(200).json({ success: true, products: paged, total, page, limit });
    } catch (err) {
        console.error("SEARCH PRODUCTS ERROR:", err);
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
    searchProducts,
};