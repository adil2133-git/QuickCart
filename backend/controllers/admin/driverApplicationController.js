const mongoose = require("mongoose");
const User = require("../../models/shared/user");
const DriverProfile = require("../../models/driver/driverProfile");
const { sendDriverApprovedEmail, sendDriverRejectedEmail } = require("../../services/mailService");

// ---------- helpers ----------

const STATUS_BADGE_MAP = {
    PENDING_APPROVAL: "pending",
    ACTIVE: "approved",
    REJECTED: "rejected",
    SUSPENDED: "rejected",
};

const STATUS_FILTER_MAP = {
    "Pending Review": "PENDING_APPROVAL",
    "Approved": "ACTIVE",
    "Rejected": "REJECTED",
};

function buildDriverCode(userId) {
    return `DRV-${userId.toString().slice(-6).toUpperCase()}`;
}

// documentUrls is stored in the fixed order set during registration:
// [drivingLicense, vehicleRC, profilePhoto]
function formatDocuments(documentUrls = []) {
    const labels = ["Driving License", "Vehicle RC", "Profile Photo"];
    return labels.map((label, i) => {
        const url = documentUrls[i] || null;
        return {
            id: String(i),
            label,
            fileUrl: url,
            fileName: url ? url.split("/").pop() : null,
        };
    });
}

function formatDriverApplication(user, profile, { includeNotes = false } = {}) {
    const documents = formatDocuments(profile.documentUrls);
    const submitted = documents.filter((d) => d.fileUrl).length;

    const base = {
        id: user._id.toString(),
        driverCode: buildDriverCode(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        vehicleType: profile.vehicleType,
        vehicleNumber: profile.vehicleNumber,
        licenseNumber: profile.licenseNumber,
        status: STATUS_BADGE_MAP[user.status] || "pending",
        documents,
        documentsSubmitted: submitted,
        documentsTotal: documents.length,
        createdAt: user.createdAt,
    };

    if (includeNotes) {
        base.reviewNotes = profile.reviewNotes || [];
        base.rejectionReason = profile.rejectionReason || null;
    }

    return base;
}

// ---------- GET /admin/drivers/applications ----------
// Supports: search, status, vehicleType, date, page, limit
const getDriverApplications = async (req, res) => {
    try {
        const {
            search = "",
            status = "All Statuses",
            vehicleType = "All Types",
            date,
            page = 1,
            limit = 4,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 4);

        const matchStage = {};
        if (vehicleType !== "All Types") {
            matchStage.vehicleType = vehicleType;
        }

        const userMatch = { "user.role": "DRIVER" };

        if (status !== "All Statuses" && STATUS_FILTER_MAP[status]) {
            userMatch["user.status"] = STATUS_FILTER_MAP[status];
        }

        if (search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            userMatch.$or = [
                { "user.name": regex },
                { "user.email": regex },
                { vehicleNumber: regex },
            ];
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

        const result = await DriverProfile.aggregate(pipeline);
        const rows = result[0]?.data || [];
        const total = result[0]?.totalCount[0]?.count || 0;

        const applications = rows.map((row) =>
            formatDriverApplication(row.user, row)
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
        console.error("[getDriverApplications]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ---------- GET /admin/drivers/applications/stats ----------
const getDriverApplicationStats = async (req, res) => {
    try {
        const [statusCounts, staleCount] = await Promise.all([
            User.aggregate([
                { $match: { role: "DRIVER" } },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            User.countDocuments({
                role: "DRIVER",
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
        console.error("[getDriverApplicationStats]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ---------- GET /admin/drivers/applications/:id ----------
const getDriverApplicationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid driver id" });
        }

        const user = await User.findOne({ _id: id, role: "DRIVER" }).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "Driver application not found" });
        }

        const profile = await DriverProfile.findOne({ userId: id }).lean();
        if (!profile) {
            return res.status(404).json({ success: false, message: "Driver profile not found" });
        }

        return res.status(200).json({
            success: true,
            application: formatDriverApplication(user, profile, { includeNotes: true }),
        });
    } catch (err) {
        console.error("[getDriverApplicationById]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ---------- POST /admin/drivers/applications/:id/notes ----------
const addDriverReviewNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid driver id" });
        }

        if (!note || !note.trim()) {
            return res.status(400).json({ success: false, message: "Note text is required" });
        }

        const profile = await DriverProfile.findOne({ userId: id });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Driver profile not found" });
        }

        const author = req.user?.name || req.user?.email || "Admin";

        profile.reviewNotes.push({ note: note.trim(), author, date: new Date() });
        await profile.save();

        return res.status(200).json({ success: true, reviewNotes: profile.reviewNotes });
    } catch (err) {
        console.error("[addDriverReviewNote]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ---------- POST /admin/drivers/applications/:id/decision ----------
const VALID_DECISIONS = ["approve", "reject", "more-info"];

const submitDriverDecision = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid driver id" });
        }

        if (!VALID_DECISIONS.includes(decision)) {
            return res.status(400).json({ success: false, message: "Invalid decision" });
        }

        if ((decision === "reject" || decision === "more-info") && !reason?.trim()) {
            return res.status(400).json({ success: false, message: "A reason is required for this decision" });
        }

        const user = await User.findOne({ _id: id, role: "DRIVER" });
        if (!user) {
            return res.status(404).json({ success: false, message: "Driver application not found" });
        }

        const profile = await DriverProfile.findOne({ userId: id });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Driver profile not found" });
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
            sendDriverApprovedEmail(user).catch(() => {});
        } else if (decision === "reject") {
            sendDriverRejectedEmail(user, reason.trim()).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: "Decision recorded successfully",
            status: user.status,
        });
    } catch (err) {
        console.error("[submitDriverDecision]", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

module.exports = {
    getDriverApplications,
    getDriverApplicationStats,
    getDriverApplicationById,
    addDriverReviewNote,
    submitDriverDecision,
};