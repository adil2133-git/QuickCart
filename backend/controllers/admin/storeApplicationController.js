const mongoose = require("mongoose");
const User = require("../../models/shared/user");
const StoreProfile = require("../../models/store/storeProfile");
const { sendStoreApprovedEmail, sendStoreRejectedEmail } = require("../../services/mailService");

// ---------- helpers ----------

const STATUS_BADGE_MAP = {
    PENDING_APPROVAL: "pending",
    ACTIVE: "approved",
    REJECTED: "rejected",
    SUSPENDED: "rejected",
};

const STATUS_FILTER_MAP = {
    "Pending": "PENDING_APPROVAL",
    "Approved": "ACTIVE",
    "Rejected": "REJECTED",
};

function buildStoreCode(userId) {
    return `STR-${userId.toString().slice(-6).toUpperCase()}`;
}

function logoInitial(name) {
    if (!name) return null;
    return name.trim().charAt(0).toUpperCase();
}

// documentUrls is stored in the fixed order set during registration:
// [tradeLicense, ownerId, storeFront]
function formatDocuments(documentUrls = []) {
    const labels = ["Trade License", "Owner ID Proof", "Store Front Photo"];
    return labels.map((label, i) => {
        const url = documentUrls[i] || null;
        return {
            id: String(i),
            label,
            fileUrl: url,
            fileName: url ? url.split("/").pop() : null,
            status: url ? "verified" : "missing",
        };
    });
}

function formatStoreApplication(user, profile, { includeNotes = false } = {}) {
    const checklist = formatDocuments(profile.documentUrls);
    const submitted = checklist.filter((d) => d.fileUrl).length;

    const base = {
        id: user._id.toString(),
        storeCode: buildStoreCode(user._id),
        name: profile.storeName,
        owner: profile.ownerName,
        contactEmail: user.email,
        contactPhone: user.phone,
        location: profile.address,
        fullAddress: profile.address,
        pincode: profile.pincode,
        type: "Retail",
        products: 0,
        radius: "—",
        logoInitial: logoInitial(profile.storeName),
        status: STATUS_BADGE_MAP[user.status] || "pending",
        checklist,
        documentsSubmitted: submitted,
        documentsTotal: checklist.length,
        dateLabel: user.createdAt,
        submittedOn: user.createdAt,
        createdAt: user.createdAt,
        // ── new ──────────────────────────────────────────────────────────
        coordinates:
            profile.coordinates &&
            (profile.coordinates.lat !== 0 || profile.coordinates.lng !== 0)
                ? { lat: profile.coordinates.lat, lng: profile.coordinates.lng }
                : null,
    };

    if (includeNotes) {
        base.reviewNotes = profile.reviewNotes || [];
        base.rejectionReason = profile.rejectionReason || null;
    }

    return base;
}

// ---------- GET /admin/stores/applications ----------
// Supports: search, status, city, date, page, limit
const getStoreApplications = async (req, res) => {
    try {
        const {
            search = "",
            status = "All",
            city = "All Cities",
            date,
            page = 1,
            limit = 4,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 4);

        const matchStage = {};

        const userMatch = { "user.role": "STORE" };

        if (status !== "All" && STATUS_FILTER_MAP[status]) {
            userMatch["user.status"] = STATUS_FILTER_MAP[status];
        }

        if (search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            userMatch.$or = [
                { storeName: regex },
                { ownerName: regex },
            ];
        }

        if (city !== "All Cities") {
            matchStage.address = new RegExp(city.trim(), "i");
        }

        if (date) {
            const start = new Date(date);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            userMatch["user.createdAt"] = { $gte: start, $lt: end };
        }

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $match: userMatch },
            { $sort: { "user.createdAt": -1 } },
            {
                $facet: {
                    data: [
                        { $skip: (pageNum - 1) * limitNum },
                        { $limit: limitNum },
                    ],
                    totalCount: [{ $count: "count" }],
                },
            },
        ];

        const result = await StoreProfile.aggregate(pipeline);
        const rows = result[0]?.data || [];
        const total = result[0]?.totalCount[0]?.count || 0;

        const applications = rows.map((row) =>
            formatStoreApplication(row.user, row)
        );

        return res.status(200).json({
            success: true,
            applications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 1,
            },
        });
    } catch (err) {
        console.error("[getStoreApplications]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ---------- GET /admin/stores/applications/stats ----------
const getStoreApplicationStats = async (req, res) => {
    try {
        const [statusCounts, staleCount] = await Promise.all([
            User.aggregate([
                { $match: { role: "STORE" } },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            User.countDocuments({
                role: "STORE",
                status: "PENDING_APPROVAL",
                createdAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
            }),
        ]);

        const counts = { PENDING_APPROVAL: 0, ACTIVE: 0, REJECTED: 0, SUSPENDED: 0 };
        statusCounts.forEach((s) => {
            counts[s._id] = s.count;
        });

        return res.status(200).json({
            success: true,
            stats: {
                pending: counts.PENDING_APPROVAL,
                approved: counts.ACTIVE,
                rejected: counts.REJECTED,
                requiringAttention: staleCount,
            },
        });
    } catch (err) {
        console.error("[getStoreApplicationStats]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ---------- GET /admin/stores/applications/:id ----------
const getStoreApplicationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid store id" });
        }

        const user = await User.findOne({ _id: id, role: "STORE" }).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "Store application not found" });
        }

        const profile = await StoreProfile.findOne({ userId: id }).lean();
        if (!profile) {
            return res.status(404).json({ success: false, message: "Store profile not found" });
        }

        return res.status(200).json({
            success: true,
            application: formatStoreApplication(user, profile, { includeNotes: true }),
        });
    } catch (err) {
        console.error("[getStoreApplicationById]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ---------- POST /admin/stores/applications/:id/notes ----------
const addStoreReviewNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid store id" });
        }

        if (!note || !note.trim()) {
            return res.status(400).json({ success: false, message: "Note text is required" });
        }

        const profile = await StoreProfile.findOne({ userId: id });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Store profile not found" });
        }

        const author = req.user?.name || req.user?.email || "Admin";

        profile.reviewNotes.push({ note: note.trim(), author, date: new Date() });
        await profile.save();

        return res.status(200).json({ success: true, reviewNotes: profile.reviewNotes });
    } catch (err) {
        console.error("[addStoreReviewNote]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ---------- POST /admin/stores/applications/:id/decision ----------
const VALID_DECISIONS = ["approve", "reject", "more-info"];

const submitStoreDecision = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid store id" });
        }

        if (!VALID_DECISIONS.includes(decision)) {
            return res.status(400).json({ success: false, message: "Invalid decision" });
        }

        if ((decision === "reject" || decision === "more-info") && !reason?.trim()) {
            return res.status(400).json({ success: false, message: "A reason is required for this decision" });
        }

        const user = await User.findOne({ _id: id, role: "STORE" });
        if (!user) {
            return res.status(404).json({ success: false, message: "Store application not found" });
        }

        const profile = await StoreProfile.findOne({ userId: id });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Store profile not found" });
        }

        const author = req.user?.name || req.user?.email || "Admin";

        if (decision === "approve") {
            user.status = "ACTIVE";
            profile.rejectionReason = null;
        } else if (decision === "reject") {
            user.status = "REJECTED";
            profile.rejectionReason = reason.trim();
        } else if (decision === "more-info") {
            user.status = "PENDING_APPROVAL";
            profile.reviewNotes.push({
                note: `Requested more info: ${reason.trim()}`,
                author,
                date: new Date(),
            });
        }

        await user.save();
        await profile.save();

        // Fire-and-forget — don't hold up the admin's response on email delivery.
        if (decision === "approve") {
            sendStoreApprovedEmail(user).catch(() => {});
        } else if (decision === "reject") {
            sendStoreRejectedEmail(user, reason.trim()).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: "Decision recorded successfully",
            status: user.status,
        });
    } catch (err) {
        console.error("[submitStoreDecision]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

module.exports = {
    getStoreApplications,
    getStoreApplicationStats,
    getStoreApplicationById,
    addStoreReviewNote,
    submitStoreDecision,
};