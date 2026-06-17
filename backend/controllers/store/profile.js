const User = require("../../models/shared/user");
const StoreProfile = require("../../models/store/storeProfile");

// GET /api/store/me
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

        // Map raw documentUrls into labeled document objects the frontend can render.
        // documentUrls is stored in the order: [tradeLicense, ownerId, storeFront] (only the ones that were provided)
        // We don't currently track per-document review status, so "submitted" just means a URL exists.
        const documents = [
            { label: "Trade License",      key: "tradeLicense", submitted: Boolean(storeProfile.documentUrls?.[0]) },
            { label: "Owner ID Proof",      key: "ownerId",      submitted: Boolean(storeProfile.documentUrls?.[1]) },
            { label: "Store Front Photo",   key: "storeFront",   submitted: Boolean(storeProfile.documentUrls?.[2]) },
        ];

        return res.status(200).json({
            success: true,
            store: {
                name: user.name,
                phone: user.phone,
                email: user.email,
                storeId: user._id,
                registeredOn: user.createdAt,
                role: "Store Partner",
                approvalStatus: user.status, // "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "REJECTED"
                storeName: storeProfile.storeName,
                ownerName: storeProfile.ownerName,
                address: storeProfile.address,
                pincode: storeProfile.pincode,
                storeStatus: storeProfile.storeStatus,
                documents,
            },
        });

    } catch (err) {
        console.error("[getMyStoreProfile]", err);
        return res.status(500).json({ success: false, message: "Server error while fetching store profile." });
    }
};

module.exports = { getMyStoreProfile };