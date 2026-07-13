const CustomerWallet = require("../models/customer/customerWallet");
const CustomerWalletTransaction = require("../models/customer/customerWalletTransaction");
const { emitToCustomer } = require("../socket");

// ─── Get or create a customer's wallet ───────────────────────────────────────
// Wallets are created lazily on first use (first refund or first checkout
// wallet-balance check) rather than at signup — most customers may never
// need one.
const getOrCreateWallet = async (customerId, session = null) => {
    let wallet = await CustomerWallet.findOne({ customerId }).session(session);
    if (!wallet) {
        const created = await CustomerWallet.create([{ customerId, balance: 0 }], { session });
        wallet = created[0];
    }
    return wallet;
};

const getBalance = async (customerId) => {
    const wallet = await CustomerWallet.findOne({ customerId }).lean();
    return wallet?.balance ?? 0;
};

// ─── Debit wallet to pay for (part of) an order ──────────────────────────────
// Must run inside the same transaction/session as the Order creation it's
// paying for, so a mid-transaction failure can't debit a wallet without an
// order to show for it. Throws if the balance is insufficient — callers
// should always clamp walletAmountUsed to the balance *before* calling this,
// so this is really a race-condition guard, not the primary validation.
const debitForOrder = async ({ customerId, amount, orderId, session }) => {
    if (amount <= 0) return;

    const wallet = await getOrCreateWallet(customerId, session);
    if (wallet.balance < amount) {
        throw new Error("Insufficient wallet balance.");
    }

    wallet.balance -= amount;
    await wallet.save({ session });

    await CustomerWalletTransaction.create(
        [
            {
                customerId,
                orderId,
                amount,
                type: "ORDER_PAYMENT",
                description: "Used for order payment",
            },
        ],
        { session }
    );
};

// ─── Credit wallet on cancellation refund ────────────────────────────────────
// Automatic — no gateway call, no waiting. This is what makes cancellation
// refunds safe to fire instantly instead of gating them behind an
// admin-triggered real-money reversal.
const creditRefund = async ({ customerId, amount, orderId, description, session = null }) => {
    if (amount <= 0) return;

    const wallet = await getOrCreateWallet(customerId, session);
    wallet.balance += amount;
    await wallet.save({ session });

    await CustomerWalletTransaction.create(
        [
            {
                customerId,
                orderId,
                amount,
                type: "REFUND_CREDIT",
                description: description || "Order cancellation refund",
            },
        ],
        { session }
    );

    // Push the new balance live so the navbar wallet pill (and wallet page,
    // if open) update instantly instead of only on next page load/refresh.
    // Skipped mid-transaction (session present) — if the transaction later
    // rolls back we don't want to have already told the client it worked.
    if (!session) {
        emitToCustomer(customerId, "wallet:updated", {
            balance: wallet.balance,
            change: amount,
            reason: "REFUND_CREDIT",
            orderId: orderId ? orderId.toString() : null,
        });
    }
};

// ─── Debit wallet for a COD cancellation fee ─────────────────────────────────
// For a PAID (online) order, the store's ₹20 "already packing" compensation
// is taken by simply refunding the customer less (see REFUND_DEDUCTION_BY_STATUS
// in ordersController.js). COD orders never collected any money up front, so
// there's nothing to withhold it from — this instead deducts it directly from
// the customer's wallet, same amount, same trigger (cancelling after packing
// has started).
//
// Unlike debitForOrder, this must NEVER throw or block the cancellation just
// because the wallet is short — the order is being cancelled either way. If
// the wallet has less than the fee, we take whatever's there and stop at
// zero rather than going negative; the shortfall is simply not collected
// (same category of gap as the rest of the store settlement system — see the
// comment in ordersController.js). Returns the amount actually deducted, so
// the caller can word the customer notification accurately.
const debitCancellationFee = async ({ customerId, amount, orderId, description }) => {
    if (amount <= 0) return 0;

    const wallet = await getOrCreateWallet(customerId);
    const actualDeduction = Math.min(amount, wallet.balance);
    if (actualDeduction <= 0) return 0;

    wallet.balance -= actualDeduction;
    await wallet.save();

    await CustomerWalletTransaction.create([
        {
            customerId,
            orderId,
            amount: actualDeduction,
            type: "CANCELLATION_FEE",
            description: description || "Cancellation fee (order was already being packed)",
        },
    ]);

    emitToCustomer(customerId, "wallet:updated", {
        balance: wallet.balance,
        change: -actualDeduction,
        reason: "CANCELLATION_FEE",
        orderId: orderId ? orderId.toString() : null,
    });

    return actualDeduction;
};

module.exports = {
    getOrCreateWallet,
    getBalance,
    debitForOrder,
    creditRefund,
    debitCancellationFee,
};