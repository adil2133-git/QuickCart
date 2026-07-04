const mongoose = require("mongoose");
const StoreReview = require("../../models/store/storeReview");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Builds initials from a display name, e.g. "Jane Doe" -> "JD".
// Falls back to "?" so one bad record doesn't break the whole reviews list.
function initialsFromName(name) {
    if (!name || typeof name !== "string") return "?";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Rating Summary  (GET /api/stores/:storeId/reviews/summary) ────────────
// Computed fresh via aggregation rather than trusting StoreProfile.averageRating,
// which could drift if it isn't recalculated on every new review.
const getStoreRatingSummary = async (req, res) => {
    try {
        const { storeId } = req.params;

        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ message: "Invalid storeId." });
        }

        const storeObjectId = new mongoose.Types.ObjectId(storeId);

        const breakdown = await StoreReview.aggregate([
            { $match: { storeId: storeObjectId } },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
        ]);

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let total = 0;
        let weightedSum = 0;

        breakdown.forEach(({ _id: star, count }) => {
            if (star >= 1 && star <= 5) {
                counts[star] = count;
                total += count;
                weightedSum += star * count;
            }
        });

        const bars = [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: counts[star],
            pct: total > 0 ? Math.round((counts[star] / total) * 100) : 0,
        }));

        return res.status(200).json({
            averageRating: total > 0 ? Math.round((weightedSum / total) * 10) / 10 : 0,
            totalReviews: total,
            bars,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// ─── Paginated Reviews  (GET /api/stores/:storeId/reviews) ─────────────────
// Uses an aggregation with two $lookup stages (review → CustomerProfile → User)
// to get reviewer names in one round-trip instead of querying per review.
const getStoreReviews = async (req, res) => {
    try {
        const { storeId } = req.params;

        if (!isValidObjectId(storeId)) {
            return res.status(400).json({ message: "Invalid storeId." });
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const storeObjectId = new mongoose.Types.ObjectId(storeId);

        const [reviews, total] = await Promise.all([
            StoreReview.aggregate([
                { $match: { storeId: storeObjectId } },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                    $lookup: {
                        from: "customerprofiles",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customerProfile",
                    },
                },
                { $unwind: { path: "$customerProfile", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "users",
                        localField: "customerProfile.userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        rating: 1,
                        review: 1,
                        createdAt: 1,
                        reviewerName: { $ifNull: ["$user.name", "Anonymous"] },
                    },
                },
            ]),
            StoreReview.countDocuments({ storeId: storeObjectId }),
        ]);

        const withInitials = reviews.map((r) => ({
            id: r._id,
            rating: r.rating,
            text: r.review,
            createdAt: r.createdAt,
            name: r.reviewerName,
            initials: initialsFromName(r.reviewerName),
        }));

        return res.status(200).json({
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            reviews: withInitials,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

module.exports = { getStoreRatingSummary, getStoreReviews };