const mongoose = require("mongoose");
const User = require("../../models/shared/user");
const StoreProfile = require("../../models/store/storeProfile");
const StoreReview = require("../../models/store/storeReview");
const { getLiveStoreStatus, distanceInKm } = require("./storeStatus");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── (existing, unchanged) GET /api/store/me ─────────────────────────────────
// Requires protectRoutes middleware (req.user.userID is set from the JWT)
const getMyStoreProfile = async (req, res) => {
    try {
        const userId = req.user.userID;

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role !== "STORE") {
            return res.status(403).json({ success: false, message: "This account is not a store account" });
        }

        const storeProfile = await StoreProfile.findOne({ userId });

        if (!storeProfile) {
            return res.status(404).json({ success: false, message: "Store profile not found" });
        }

        const documents = [
            { label: "Trade License",    key: "tradeLicense", submitted: Boolean(storeProfile.documentUrls?.[0]) },
            { label: "Owner ID Proof",   key: "ownerId",      submitted: Boolean(storeProfile.documentUrls?.[1]) },
            { label: "Store Front Photo", key: "storeFront",  submitted: Boolean(storeProfile.documentUrls?.[2]) },
        ];

        return res.status(200).json({
            success: true,
            store: {
                name: user.name,
                phone: user.phone,
                email: user.email,
                storeId: storeProfile._id,
                registeredOn: user.createdAt,
                role: "Store Partner",
                approvalStatus: user.status,
                storeName: storeProfile.storeName,
                ownerName: storeProfile.ownerName,
                address: storeProfile.address,
                pincode: storeProfile.pincode,
                storeStatus: storeProfile.storeStatus,
                logoUrl: storeProfile.logoUrl,
                coverImageUrl: storeProfile.coverImageUrl,
                isManuallyClosed: storeProfile.isManuallyClosed,
                operatingHours: storeProfile.operatingHours,
                documents,
            },
        });
    } catch (err) {
        console.error("[getMyStoreProfile]", err);
        return res.status(500).json({ success: false, message: "Server error while fetching store profile." });
    }
};

// ─── Resolve the logged-in STORE user's StoreProfile._id ────────────────────
// Same helper as used in productController/categoryController.
const resolveStoreId = async (req) => {
    const userId = req.user.userID;
    const storeProfile = await StoreProfile.findOne({ userId });
    return storeProfile ? storeProfile._id : null;
};

// ─── Upload/replace logo + cover image  (PATCH /api/store/branding) ─────────
// Expects multer fields: `logo` (single) and `coverImage` (single), uploaded
// via a Cloudinary storage engine the same way uploadProductImages works for
// product photos. Either field may be sent alone — only the provided one(s)
// get updated.
const updateStoreBranding = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ success: false, message: "Store profile not found for this account." });
        }

        const updates = {};

        // multer.fields() puts each field's files under req.files[fieldName][0]
        if (req.files?.logo?.[0]) {
            updates.logoUrl = req.files.logo[0].path;
        }
        if (req.files?.coverImage?.[0]) {
            updates.coverImageUrl = req.files.coverImage[0].path;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No image provided. Send `logo` and/or `coverImage`.",
            });
        }

        const store = await StoreProfile.findByIdAndUpdate(storeId, { $set: updates }, { new: true });

        return res.status(200).json({
            success: true,
            message: "Store branding updated.",
            logoUrl: store.logoUrl,
            coverImageUrl: store.coverImageUrl,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// ─── Toggle manual close  (PATCH /api/store/toggleManualClose) ──────────────
// Lets a store owner mark themselves closed regardless of operatingHours
// (e.g. "closing early today"). Does not touch storeStatus, which remains
// reserved for the BUSY signal.
const toggleManualClose = async (req, res) => {
    try {
        const storeId = await resolveStoreId(req);

        if (!storeId) {
            return res.status(404).json({ success: false, message: "Store profile not found for this account." });
        }

        const store = await StoreProfile.findById(storeId);

        if (!store) {
            return res.status(404).json({ success: false, message: "Store profile not found." });
        }

        store.isManuallyClosed = !store.isManuallyClosed;
        await store.save();

        return res.status(200).json({
            success: true,
            message: store.isManuallyClosed ? "Store marked as closed." : "Store reopened.",
            isManuallyClosed: store.isManuallyClosed,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

// ─── Public store detail  (GET /api/stores/:storeId) ────────────────────────
// Customer-facing — no store JWT involved. storeId comes from the URL, not
// from resolveStoreId. Optionally accepts ?lat=&lng= (the customer's current
// or selected saved-address coordinates) to compute distance; if omitted,
// distanceKm is returned as null rather than guessed.
const getPublicStoreProfile = async (req, res) => {
    try {
        const { storeId } = req.params;

        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ success: false, message: "Invalid storeId." });
        }

        const store = await StoreProfile.findById(storeId);

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found." });
        }

        const { lat, lng } = req.query;
        let distanceKm = null;
        if (lat !== undefined && lng !== undefined) {
            const customerLat = Number(lat);
            const customerLng = Number(lng);
            if (!Number.isNaN(customerLat) && !Number.isNaN(customerLng)) {
                distanceKm = distanceInKm({ lat: customerLat, lng: customerLng }, store.coordinates);
            }
        }

        const liveStatus = getLiveStoreStatus(store);
        const reviewCount = await StoreReview.countDocuments({ storeId: store._id });

        return res.status(200).json({
            success: true,
            store: {
                _id: store._id,
                storeName: store.storeName,
                address: store.address,
                logoUrl: store.logoUrl,
                coverImageUrl: store.coverImageUrl,
                operatingHours: store.operatingHours,
                status: liveStatus.status, // "OPEN" | "CLOSED" | "BUSY", derived
                averageRating: store.averageRating,
                reviewCount,
                totalOrders: store.totalOrders,
                distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error.", error: error.message });
    }
};

module.exports = {
    getMyStoreProfile,
    updateStoreBranding,
    toggleManualClose,
    getPublicStoreProfile,
};