const CustomerWallet = require("../models/customer/customerWallet");
const CustomerWalletTransaction = require("../models/customer/customerWalletTransaction");
const { emitToCustomer } = require("../socket");

// wallets are created lazily on first use, not at signup — most customers may never need one
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

// must run in the same transaction as the order it's paying for, so a
// mid-transaction failure can't debit a wallet with no order to show for it.
// callers should already clamp the amount to the balance before calling this —
// the throw here is just a race-condition guard, not the primary check
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

// automatic, no gateway call — this is what makes cancellation refunds
// safe to fire instantly instead of needing an admin to reverse real money
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

    // push the new balance live so the navbar/wallet page update instantly.
    // skipped mid-transaction — if it later rolls back we don't want the
    // client to already think it worked
    if (!session) {
        emitToCustomer(customerId, "wallet:updated", {
            balance: wallet.balance,
            change: amount,
            reason: "REFUND_CREDIT",
            orderId: orderId ? orderId.toString() : null,
        });
    }
};

// for a PAID order, the store's cancellation fee is taken by refunding the
// customer less (see ordersController.js). COD orders never collected money
// up front, so this deducts the same fee straight from the wallet instead.
//
// unlike debitForOrder, this must never block the cancellation just because
// the wallet is short — it takes whatever's available and stops at zero
// rather than going negative, and returns the amount actually deducted so
// the caller can word the notification accurately
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