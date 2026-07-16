const DriverProfile = require("../../models/driver/driverProfile");
const { TIERS, MILESTONES, resolveTier, resolveNextTier } = require("../../services/driverTierService");

const resolveDriverProfile = async (req) => {
    const profile = await DriverProfile.findOne({ userId: req.user.userID });
    if (!profile) throw new Error("Driver profile not found");
    return profile;
};

// ─────────────────────────────────────────────────────────────
// GET /api/driver/rewards
// Tier progress, the full tier ladder, and delivery-count
// milestones — everything computed live from totalDeliveries
// rather than trusting the (previously never-updated) stored
// currentLevel field.
// ─────────────────────────────────────────────────────────────
const getRewardsSummary = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const totalDeliveries = driver.totalDeliveries;

        const tier = resolveTier(totalDeliveries);
        const next = resolveNextTier(totalDeliveries);

        // % progress toward the next tier, measured from the current tier's
        // own threshold — so the bar always starts at 0% right after
        // levelling up, not part-way full.
        const progressPercent = next
            ? Math.round(
                  ((totalDeliveries - tier.minDeliveries) /
                      (next.tier.minDeliveries - tier.minDeliveries)) *
                      100
              )
            : 100;

        const ladder = TIERS.map((t) => ({
            key: t.key,
            label: t.label,
            minDeliveries: t.minDeliveries,
            perks: t.perks,
            achieved: totalDeliveries >= t.minDeliveries,
            isCurrent: t.key === tier.key,
        }));

        const milestones = MILESTONES.map((count) => ({
            deliveries: count,
            achieved: totalDeliveries >= count,
        }));

        return res.status(200).json({
            success: true,
            rewards: {
                currentLevel: tier.key,
                currentLevelLabel: tier.label,
                currentPerks: tier.perks,
                totalDeliveries,
                averageRating: driver.averageRating,
                memberSince: driver.createdAt,
                nextLevel: next
                    ? { key: next.tier.key, label: next.tier.label, deliveriesRemaining: next.deliveriesRemaining }
                    : null,
                progressPercent,
                ladder,
                milestones,
            },
        });
    } catch (err) {
        console.error("[getRewardsSummary]", err);
        return res.status(500).json({ success: false, message: "Failed to load rewards." });
    }
};

module.exports = { getRewardsSummary };