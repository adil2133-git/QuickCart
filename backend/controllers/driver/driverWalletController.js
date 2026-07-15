const DriverProfile = require("../../models/driver/driverProfile");
const Order = require("../../models/shared/order");
const WalletTransaction = require("../../models/driver/walletTransaction");
const { emitToDriver } = require("../../socket");

const resolveDriverProfile = async (req) => {
    const profile = await DriverProfile.findOne({ userId: req.user.userID });
    if (!profile) throw new Error("Driver profile not found");
    return profile;
};

// hardcoded for now — move to config once real payout scheduling exists
const WITHDRAWAL_MIN_AMOUNT = 100;

// next Monday, 00:00 — payouts run weekly. Purely a display date for now,
// nothing actually triggers a payout run on this date yet.
const nextScheduledPayout = () => {
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    return next;
};

const toTransactionShape = (txn) => ({
    id: txn._id.toString(),
    type: txn.type,
    amount: txn.amount,
    description: txn.description ?? "",
    orderId: txn.orderId ? txn.orderId._id?.toString() ?? txn.orderId.toString() : null,
    orderNumber: txn.orderId?.orderNumber ?? null,
    createdAt: txn.createdAt,
});

// ─────────────────────────────────────────────────────────────
// GET /api/driver/wallet
// Wallet Balance tab: available balance, this month's earnings,
// next payout date, and recent transactions.
// ─────────────────────────────────────────────────────────────
const getWalletSummary = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [monthAgg, recentTxns] = await Promise.all([
            WalletTransaction.aggregate([
                {
                    $match: {
                        driverId: driver._id,
                        type: { $in: ["EARNING", "BONUS"] },
                        createdAt: { $gte: startOfMonth },
                    },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            WalletTransaction.find({ driverId: driver._id })
                .populate({ path: "orderId", select: "orderNumber" })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);

        return res.status(200).json({
            success: true,
            wallet: {
                availableBalance: driver.walletBalance,
                earnedThisMonth: monthAgg[0]?.total ?? 0,
                nextPayoutDate: nextScheduledPayout(),
                transactions: recentTxns.map(toTransactionShape),
            },
        });
    } catch (err) {
        console.error("[getWalletSummary]", err);
        return res.status(500).json({ success: false, message: "Failed to load wallet." });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/driver/wallet/withdraw
// Withdraws the full available balance (or a specified amount) to the
// driver's bank account. No real bank/payment-gateway integration yet —
// this processes the withdrawal instantly. Advanced version would queue
// this as a WithdrawalRequest for admin approval before debiting.
// ─────────────────────────────────────────────────────────────
const withdrawFunds = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const requested = Number(req.body.amount);

        const amount = Number.isFinite(requested) && requested > 0
            ? requested
            : driver.walletBalance;

        if (amount < WITHDRAWAL_MIN_AMOUNT) {
            return res.status(400).json({
                success: false,
                message: `Minimum withdrawal amount is ₹${WITHDRAWAL_MIN_AMOUNT}.`,
            });
        }

        if (amount > driver.walletBalance) {
            return res.status(400).json({
                success: false,
                message: "Withdrawal amount exceeds available balance.",
            });
        }

        driver.walletBalance -= amount;
        await driver.save();

        const txn = await WalletTransaction.create({
            driverId: driver._id,
            amount,
            type: "WITHDRAWAL",
            description: `Bank withdrawal — Ref: WDR-${Date.now().toString().slice(-6)}`,
        });

        emitToDriver(driver._id, "wallet:updated", {
            balance: driver.walletBalance,
            change: -amount,
            reason: "WITHDRAWAL",
            transaction: toTransactionShape(txn),
        });

        return res.status(200).json({
            success: true,
            message: "Withdrawal processed.",
            availableBalance: driver.walletBalance,
            transaction: toTransactionShape(txn),
        });
    } catch (err) {
        console.error("[withdrawFunds]", err);
        return res.status(500).json({ success: false, message: "Failed to process withdrawal." });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/driver/wallet/cod
// COD Settlement tab: lifetime cash collected, current amount pending
// settlement, and a paginated list of COD orders with their settlement
// status.
// ─────────────────────────────────────────────────────────────
const getCodSummary = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 6);
        const skip = (page - 1) * limit;

        const filter = {
            driverId: driver._id,
            paymentMethod: "COD",
            paymentStatus: "PAID",
        };

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .select("orderNumber totalAmount codSettlementStatus codSettledAt createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            cod: {
                totalCashCollected: driver.cashCollected,
                pendingSettlement: driver.cashPendingSettlement,
                settlementDueAmount: driver.cashPendingSettlement,
                orders: orders.map((o) => ({
                    orderId: o._id.toString(),
                    orderNumber: o.orderNumber,
                    amountCollected: o.totalAmount,
                    status: o.codSettlementStatus,
                    settledAt: o.codSettledAt,
                    date: o.createdAt,
                })),
                total,
                page,
                pages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (err) {
        console.error("[getCodSummary]", err);
        return res.status(500).json({ success: false, message: "Failed to load COD settlement data." });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/driver/wallet/cod/settle
// Settles all currently-pending COD orders in one go. No partial/per-order
// settlement yet, and no admin-side confirmation step — advanced version
// would route this through a review step before clearing the balance.
// ─────────────────────────────────────────────────────────────
const settleCod = async (req, res) => {
    try {
        const driver = await resolveDriverProfile(req);

        if (driver.cashPendingSettlement <= 0) {
            return res.status(400).json({
                success: false,
                message: "There's no pending cash to settle.",
            });
        }

        const pendingOrders = await Order.find({
            driverId: driver._id,
            paymentMethod: "COD",
            paymentStatus: "PAID",
            codSettlementStatus: "PENDING",
        }).select("_id totalAmount");

        const settledTotal = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const now = new Date();

        await Order.updateMany(
            { _id: { $in: pendingOrders.map((o) => o._id) } },
            { $set: { codSettlementStatus: "SETTLED", codSettledAt: now } }
        );

        driver.cashPendingSettlement = Math.max(0, driver.cashPendingSettlement - settledTotal);
        await driver.save();

        return res.status(200).json({
            success: true,
            message: "Cash settled successfully.",
            settledAmount: settledTotal,
            pendingSettlement: driver.cashPendingSettlement,
        });
    } catch (err) {
        console.error("[settleCod]", err);
        return res.status(500).json({ success: false, message: "Failed to settle cash." });
    }
};

module.exports = {
    getWalletSummary,
    withdrawFunds,
    getCodSummary,
    settleCod,
};