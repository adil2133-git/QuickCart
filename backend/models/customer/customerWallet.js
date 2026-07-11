const mongoose = require("mongoose");

// One wallet doc per customer. Balance only ever moves via walletService —
// never edit `balance` directly from a controller, or the CustomerWalletTransaction
// ledger below will drift out of sync with the actual balance.
//
// This wallet is refund/cashback-credit only — there is deliberately no
// "add money" route anywhere in the app. A wallet customers can top up
// directly with their own money would fall under RBI's Prepaid Payment
// Instrument (PPI) rules and need a license. Refund-only stays outside that.
const customerWalletSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomerProfile",
            required: true,
            unique: true,
        },
        balance: { type: Number, required: true, default: 0 },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("CustomerWallet", customerWalletSchema);