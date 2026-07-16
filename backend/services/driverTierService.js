// Driver loyalty tiers.
//
// PLACEHOLDER THRESHOLDS — these numbers and perks are not from real product
// documentation, just reasonable defaults so the Rewards page has something
// real to compute against instead of showing fabricated data. Swap the
// `minDeliveries` and `perks` below once real tier rules exist.
const TIERS = [
    {
        key: "BRONZE",
        label: "Bronze",
        minDeliveries: 0,
        perks: ["Standard dispatch priority", "Weekly payouts"],
    },
    {
        key: "SILVER",
        label: "Silver",
        minDeliveries: 50,
        perks: ["Wider dispatch radius", "Weekly payouts"],
    },
    {
        key: "GOLD",
        label: "Gold",
        minDeliveries: 150,
        perks: ["Priority dispatch", "Dedicated support line"],
    },
    {
        key: "PLATINUM",
        label: "Platinum",
        minDeliveries: 400,
        perks: ["Highest dispatch priority", "Exclusive bonus challenges"],
    },
];

// Delivery-count milestones for the achievements/badges list.
const MILESTONES = [1, 10, 50, 100, 250, 500];

// Returns the tier a driver qualifies for right now, based on totalDeliveries.
const resolveTier = (totalDeliveries) => {
    let current = TIERS[0];
    for (const tier of TIERS) {
        if (totalDeliveries >= tier.minDeliveries) current = tier;
    }
    return current;
};

// Returns { tier, deliveriesRemaining } for the next tier up, or null if
// already at the highest tier.
const resolveNextTier = (totalDeliveries) => {
    const next = TIERS.find((tier) => totalDeliveries < tier.minDeliveries);
    if (!next) return null;
    return { tier: next, deliveriesRemaining: next.minDeliveries - totalDeliveries };
};

module.exports = { TIERS, MILESTONES, resolveTier, resolveNextTier };
