const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const DriverProfile = require("../models/driver/driverProfile");
const DriverEarnings = require("../models/driver/driverEarnings");
const WalletTransaction = require("../models/driver/walletTransaction");
const WithdrawalRequest = require("../models/driver/withdrawalRequest");
const CodSettlement = require("../models/driver/codSettlement");
const Order = require("../models/shared/order");
const { notifyDriver } = require("./notificationService");
const { emitToDriver } = require("../socket");

// ── Tunables ─────────────────────────────────────────────────────────────
const SETTLEMENT_DELAY_MS = 24 * 60 * 60 * 1000; // T+1
const COD_WARNING_LIMIT = 1000;
const COD_RESTRICTED_LIMIT = 3000;
const COD_SUSPENSION_MS = 24 * 60 * 60 * 1000; // unsettled beyond this -> SUSPENDED
const COD_REMINDER_INTERVAL_MS = 6 * 60 * 60 * 1000; // don't re-nag more than once per 6h
const WITHDRAWAL_MIN_AMOUNT = 100;
const WITHDRAWAL_DAILY_LIMIT = 10000;

class WalletError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const round2 = (n) => Math.round(n * 100) / 100;

// ── Earnings: DELIVERED -> pendingBalance ───────────────────────────────
// Called from advanceDeliveryStage when stage === "DELIVERED". Mutates the
// in-memory driver doc (pendingBalance) but does NOT save it — the caller
// already persists the driver in the same request, so this avoids a
// duplicate write. Does create the DriverEarnings + WalletTransaction rows
// itself since those are independent documents.
const creditEarning = async ({ driver, order }) => {
    const amount = round2(order.deliveryCharge ?? 0);
    if (amount <= 0) return null;

    const now = new Date();
    const availableAt = new Date(now.getTime() + SETTLEMENT_DELAY_MS);

    driver.pendingBalance = round2((driver.pendingBalance || 0) + amount);

    const [earnings, txn] = await Promise.all([
        DriverEarnings.create({
            driverId: driver._id,
            orderId: order._id,
            commission: amount,
            bonus: 0,
            totalEarned: amount,
            status: "PENDING",
            availableAt,
        }),
        WalletTransaction.create({
            driverId: driver._id,
            orderId: order._id,
            amount,
            type: "EARNING",
            status: "PENDING",
            description: `Delivery payout for order #${order.orderNumber} (pending 24h settlement)`,
        }),
    ]);

    emitToDriver(driver._id, "wallet:updated", {
        pendingBalance: driver.pendingBalance,
        availableBalance: driver.availableBalance,
        change: amount,
        reason: "EARNING",
        orderId: order._id.toString(),
        transaction: {
            id: txn._id.toString(),
            type: txn.type,
            status: txn.status,
            amount: txn.amount,
            description: txn.description,
            orderNumber: order.orderNumber,
            createdAt: txn.createdAt,
        },
    });

    notifyDriver.earningPending(driver.userId, order.orderNumber, amount, order._id).catch(() => {});

    return { amount, earnings, transaction: txn };
};

// ── T+1 settlement cron: pendingBalance -> availableBalance ────────────
// Picks up every DriverEarnings row whose 24h window has passed and is
// still PENDING, moves the amount over, and flips the matching
// WalletTransaction to AVAILABLE. Runs as a flat loop (consistent with the
// other cron jobs in this codebase) since settlement volume is low.
const settlePendingEarnings = async () => {
    const now = new Date();
    const dueEarnings = await DriverEarnings.find({
        status: "PENDING",
        availableAt: { $lte: now },
    }).limit(500);

    let settledCount = 0;

    for (const earning of dueEarnings) {
        try {
            const driver = await DriverProfile.findById(earning.driverId);
            if (!driver) continue;

            driver.pendingBalance = round2(Math.max(0, (driver.pendingBalance || 0) - earning.totalEarned));
            driver.availableBalance = round2((driver.availableBalance || 0) + earning.totalEarned);
            await driver.save();

            earning.status = "AVAILABLE";
            earning.settledAt = now;
            await earning.save();

            await WalletTransaction.updateOne(
                { driverId: earning.driverId, orderId: earning.orderId, type: "EARNING", status: "PENDING" },
                { status: "AVAILABLE" }
            );

            emitToDriver(driver._id, "wallet:updated", {
                pendingBalance: driver.pendingBalance,
                availableBalance: driver.availableBalance,
                change: earning.totalEarned,
                reason: "SETTLEMENT",
            });

            notifyDriver.balanceAvailable(driver.userId, earning.totalEarned).catch(() => {});
            settledCount += 1;
        } catch (err) {
            console.error(`[settlePendingEarnings] Failed for earning ${earning._id}:`, err.message);
        }
    }

    return settledCount;
};

// ── COD restriction tiering ─────────────────────────────────────────────
const computeCodTier = ({ cashPendingSettlement, cashPendingSince }) => {
    if (cashPendingSettlement <= 0) return "NORMAL";

    if (cashPendingSince && Date.now() - new Date(cashPendingSince).getTime() >= COD_SUSPENSION_MS) {
        return "SUSPENDED";
    }
    if (cashPendingSettlement > COD_RESTRICTED_LIMIT) return "RESTRICTED";
    if (cashPendingSettlement > COD_WARNING_LIMIT) return "WARNING";
    return "NORMAL";
};

// Recomputes and mutates driver.codRestrictionStatus in place based on its
// current cashPendingSettlement/cashPendingSince. Does NOT save — callers
// typically have other driver field changes pending in the same save().
const syncCodRestriction = (driver) => {
    const oldTier = driver.codRestrictionStatus;
    const newTier = computeCodTier(driver);
    driver.codRestrictionStatus = newTier;
    return { changed: oldTier !== newTier, oldTier, newTier };
};

const notifyCodRestrictionChange = (driver, oldTier, newTier) => {
    if (oldTier === newTier) return;
    if (newTier === "NORMAL") {
        notifyDriver.codRestrictionRemoved(driver.userId).catch(() => {});
    } else {
        notifyDriver.codRestrictionActivated(driver.userId, newTier, driver.cashPendingSettlement).catch(() => {});
    }
};

// whether a driver may go ONLINE at all right now
const canGoOnline = (driver) =>
    driver.codRestrictionStatus !== "RESTRICTED" && driver.codRestrictionStatus !== "SUSPENDED";

// whether a driver is eligible to receive/accept a given order right now
const isEligibleForOrder = (driver, order) => {
    if (driver.codRestrictionStatus === "RESTRICTED" || driver.codRestrictionStatus === "SUSPENDED") {
        return false;
    }
    if (order.paymentMethod === "COD" && driver.codRestrictionStatus === "WARNING") {
        return false;
    }
    return true;
};

// ── COD cash collection ─────────────────────────────────────────────────
// Called from confirmCashCollected. Mutates driver + order in place; caller
// saves both in a single pass and fires the restriction-change notification
// using the returned tier transition.
const collectCash = ({ driver, order }) => {
    const amount = order.totalAmount;

    driver.cashCollected = round2((driver.cashCollected || 0) + amount);

    const wasZero = (driver.cashPendingSettlement || 0) <= 0;
    driver.cashPendingSettlement = round2((driver.cashPendingSettlement || 0) + amount);
    if (wasZero) driver.cashPendingSince = new Date();

    order.paymentStatus = "PAID";
    order.codCollectedAt = new Date();

    return syncCodRestriction(driver);
};

// ── COD settlement (wallet / partial / online) ──────────────────────────
// walletAmountRequested: how much of availableBalance the driver wants to
// apply — omit/undefined to auto-offset with as much as is available
// (requirement 6), 0 to pay fully online, or any amount in between for the
// partial flow. Nothing is deducted from availableBalance here if an online
// leg is required — that only happens once the Razorpay payment verifies,
// so a dismissed/failed checkout never leaves the wallet silently debited.
const initiateCodSettlement = async ({ driver, walletAmountRequested }) => {
    const totalDue = round2(driver.cashPendingSettlement || 0);
    if (totalDue <= 0) {
        throw new WalletError("There's no pending cash to settle.");
    }

    // if a settlement is already awaiting online payment, hand back the same
    // Razorpay order instead of creating a new one — otherwise a dismissed
    // checkout would permanently block the driver from retrying
    const existingPending = await CodSettlement.findOne({ driverId: driver._id, status: "PENDING_PAYMENT" });
    if (existingPending) {
        return {
            fullySettled: false,
            settlementId: existingPending._id.toString(),
            walletAmountUsed: existingPending.walletAmountUsed,
            onlineAmountDue: existingPending.onlineAmountDue,
            razorpayOrder: {
                id: existingPending.razorpayOrderId,
                amount: Math.round(existingPending.onlineAmountDue * 100),
                currency: "INR",
            },
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        };
    }

    const walletAvailable = Math.max(0, driver.availableBalance || 0);
    const requested = walletAmountRequested === undefined ? walletAvailable : Number(walletAmountRequested);

    if (!Number.isFinite(requested) || requested < 0) {
        throw new WalletError("Invalid wallet amount.");
    }

    const walletAmountUsed = round2(Math.min(requested, walletAvailable, totalDue));
    const onlineAmountDue = round2(totalDue - walletAmountUsed);

    const pendingOrders = await Order.find({
        driverId: driver._id,
        paymentMethod: "COD",
        paymentStatus: "PAID",
        codSettlementStatus: "PENDING",
    }).select("_id");

    // ── Fully covered by wallet: settle synchronously, no Razorpay needed ──
    if (onlineAmountDue <= 0) {
        driver.availableBalance = round2(driver.availableBalance - walletAmountUsed);
        driver.cashPendingSettlement = 0;
        driver.cashPendingSince = null;

        const restriction = syncCodRestriction(driver);
        await driver.save();

        const now = new Date();
        await Order.updateMany(
            { _id: { $in: pendingOrders.map((o) => o._id) } },
            { $set: { codSettlementStatus: "SETTLED", codSettledAt: now } }
        );

        const settlement = await CodSettlement.create({
            driverId: driver._id,
            orderIds: pendingOrders.map((o) => o._id),
            totalAmount: totalDue,
            walletAmountUsed,
            onlineAmountDue: 0,
            status: "COMPLETED",
            completedAt: now,
        });

        if (walletAmountUsed > 0) {
            await WalletTransaction.create({
                driverId: driver._id,
                amount: walletAmountUsed,
                type: "COD_SETTLEMENT",
                status: "COMPLETED",
                description: `Wallet used to settle COD cash — Ref: CODS-${settlement._id.toString().slice(-6)}`,
            });
            notifyDriver.walletUsedForCod(driver.userId, walletAmountUsed).catch(() => {});
        }

        notifyCodRestrictionChange(driver, restriction.oldTier, restriction.newTier);

        emitToDriver(driver._id, "wallet:updated", {
            availableBalance: driver.availableBalance,
            cashPendingSettlement: driver.cashPendingSettlement,
            change: -walletAmountUsed,
            reason: "COD_SETTLEMENT",
        });

        return {
            fullySettled: true,
            settledAmount: totalDue,
            walletAmountUsed,
            onlineAmountDue: 0,
            razorpayOrder: null,
            settlementId: settlement._id.toString(),
        };
    }

    // ── Online leg required: create the settlement record + Razorpay order,
    //    but don't touch wallet/COD balances until verify-payment confirms ──
    const settlement = await CodSettlement.create({
        driverId: driver._id,
        orderIds: pendingOrders.map((o) => o._id),
        totalAmount: totalDue,
        walletAmountUsed,
        onlineAmountDue,
        status: "PENDING_PAYMENT",
    });

    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(onlineAmountDue * 100), // paise
        currency: "INR",
        receipt: `cods_${settlement._id.toString().slice(-8)}`,
        notes: {
            driverId: driver._id.toString(),
            codSettlementId: settlement._id.toString(),
        },
    });

    settlement.razorpayOrderId = razorpayOrder.id;
    await settlement.save();

    return {
        fullySettled: false,
        settlementId: settlement._id.toString(),
        walletAmountUsed,
        onlineAmountDue,
        razorpayOrder,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    };
};

// Verifies the Razorpay payment for a settlement's online leg and commits
// both the wallet debit and the COD payoff atomically (in application
// terms — re-checks balance at commit time since it may have moved since
// initiateCodSettlement ran).
const completeCodSettlementPayment = async ({
    driver,
    settlementId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
}) => {
    const settlement = await CodSettlement.findOne({
        _id: settlementId,
        driverId: driver._id,
        status: "PENDING_PAYMENT",
    });
    if (!settlement) {
        throw new WalletError("Settlement not found or already completed.");
    }
    if (settlement.razorpayOrderId !== razorpay_order_id) {
        throw new WalletError("Payment does not match this settlement.");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new WalletError("Payment verification failed.");
    }

    // re-check the wallet portion is still available — it may have been
    // withdrawn/spent since initiateCodSettlement was called. The online
    // leg is already paid regardless, so cap the wallet portion to what's
    // actually there and leave any shortfall in cashPendingSettlement.
    const actualWalletUsed = round2(Math.min(settlement.walletAmountUsed, Math.max(0, driver.availableBalance || 0)));
    const amountSettled = round2(actualWalletUsed + settlement.onlineAmountDue);
    const shortfall = round2(Math.max(0, settlement.totalAmount - amountSettled));

    if (actualWalletUsed > 0) {
        driver.availableBalance = round2(driver.availableBalance - actualWalletUsed);
    }
    driver.cashPendingSettlement = round2(Math.max(0, driver.cashPendingSettlement - amountSettled));
    if (driver.cashPendingSettlement <= 0) {
        driver.cashPendingSettlement = 0;
        driver.cashPendingSince = null;
    }

    const restriction = syncCodRestriction(driver);
    await driver.save();

    const now = new Date();
    if (shortfall <= 0) {
        await Order.updateMany(
            { _id: { $in: settlement.orderIds } },
            { $set: { codSettlementStatus: "SETTLED", codSettledAt: now } }
        );
    }

    settlement.status = "COMPLETED";
    settlement.walletAmountUsed = actualWalletUsed;
    settlement.razorpayPaymentId = razorpay_payment_id;
    settlement.razorpaySignature = razorpay_signature;
    settlement.completedAt = now;
    await settlement.save();

    if (actualWalletUsed > 0) {
        await WalletTransaction.create({
            driverId: driver._id,
            amount: actualWalletUsed,
            type: "COD_SETTLEMENT",
            status: "COMPLETED",
            description: `Wallet used to settle COD cash — Ref: CODS-${settlement._id.toString().slice(-6)}`,
        });
        notifyDriver.walletUsedForCod(driver.userId, actualWalletUsed).catch(() => {});
    }

    notifyCodRestrictionChange(driver, restriction.oldTier, restriction.newTier);

    emitToDriver(driver._id, "wallet:updated", {
        availableBalance: driver.availableBalance,
        cashPendingSettlement: driver.cashPendingSettlement,
        change: -actualWalletUsed,
        reason: "COD_SETTLEMENT",
    });

    return {
        settledAmount: amountSettled,
        walletAmountUsed: actualWalletUsed,
        onlineAmountPaid: settlement.onlineAmountDue,
        shortfall,
        pendingSettlement: driver.cashPendingSettlement,
    };
};

const requestWithdrawal = async ({ driver, amount }) => {
    const resolvedAmount = round2(Number.isFinite(amount) && amount > 0 ? amount : driver.availableBalance);

    if (resolvedAmount < WITHDRAWAL_MIN_AMOUNT) {
        throw new WalletError(`Minimum withdrawal amount is ₹${WITHDRAWAL_MIN_AMOUNT}.`);
    }
    if (resolvedAmount > driver.availableBalance) {
        throw new WalletError("Withdrawal amount exceeds your available balance.");
    }

    // Block if a withdrawal already processed today (duplicate prevention)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayTotalAgg = await WithdrawalRequest.aggregate([
        {
            $match: {
                driverId: driver._id,
                requestedAt: { $gte: startOfDay },
                status: { $ne: "REJECTED" },
            },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const todayTotal = todayTotalAgg[0]?.total ?? 0;

    if (todayTotal + resolvedAmount > WITHDRAWAL_DAILY_LIMIT) {
        throw new WalletError(`Daily withdrawal limit is ₹${WITHDRAWAL_DAILY_LIMIT}. You've already withdrawn ₹${todayTotal} today.`);
    }

    // Deduct balance immediately — no admin step
    driver.availableBalance = round2(driver.availableBalance - resolvedAmount);
    await driver.save();

    await WalletTransaction.create({
        driverId: driver._id,
        amount: resolvedAmount,
        type: "WITHDRAWAL",
        status: "COMPLETED",
        description: `Bank withdrawal — Ref: WDR-${Date.now().toString().slice(-6)}`,
    });

    const withdrawal = await WithdrawalRequest.create({
        driverId: driver._id,
        amount: resolvedAmount,
        status: "PAID",
        reviewedAt: new Date(),
        paidAt: new Date(),
    });

    emitToDriver(driver._id, "wallet:updated", {
        availableBalance: driver.availableBalance,
        event: "WITHDRAWAL_PROCESSED",
        amount: resolvedAmount,
    });

    notifyDriver.withdrawalApproved(driver.userId, resolvedAmount).catch(() => {});

    return withdrawal;
};

// ── Periodic sweep: SUSPENDED transitions + reminder nudges ─────────────
// Restriction is recomputed reactively on collect/settle, but the SUSPENDED
// tier is time-based (unsettled beyond COD_SUSPENSION_MS) so it needs a
// periodic check even with no new activity. Also nudges drivers who still
// have cash pending, throttled to once per COD_REMINDER_INTERVAL_MS.
const sweepCodRestrictions = async () => {
    const drivers = await DriverProfile.find({ cashPendingSettlement: { $gt: 0 } });
    let updated = 0;

    for (const driver of drivers) {
        try {
            const restriction = syncCodRestriction(driver);
            let dirty = restriction.changed;

            const dueForReminder =
                !driver.lastCodReminderAt ||
                Date.now() - new Date(driver.lastCodReminderAt).getTime() >= COD_REMINDER_INTERVAL_MS;

            if (dueForReminder) {
                driver.lastCodReminderAt = new Date();
                dirty = true;
                notifyDriver.codReminder(driver.userId, driver.cashPendingSettlement).catch(() => {});
            }

            if (dirty) {
                await driver.save();
                updated += 1;
            }

            notifyCodRestrictionChange(driver, restriction.oldTier, restriction.newTier);
        } catch (err) {
            console.error(`[sweepCodRestrictions] Failed for driver ${driver._id}:`, err.message);
        }
    }

    return updated;
};

module.exports = {
    WalletError,
    creditEarning,
    settlePendingEarnings,
    computeCodTier,
    syncCodRestriction,
    notifyCodRestrictionChange,
    canGoOnline,
    isEligibleForOrder,
    collectCash,
    initiateCodSettlement,
    completeCodSettlementPayment,
    requestWithdrawal,
    sweepCodRestrictions,
    WITHDRAWAL_MIN_AMOUNT,
    WITHDRAWAL_DAILY_LIMIT,
    COD_WARNING_LIMIT,
    COD_RESTRICTED_LIMIT,
};