const CustomerWallet = require("../models/customer/customerWallet");
const CustomerWalletTransaction = require("../models/customer/customerWalletTransaction");

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
};

module.exports = {
    getOrCreateWallet,
    getBalance,
    debitForOrder,
    creditRefund,
};