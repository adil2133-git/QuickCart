const mongoose = require("mongoose");

// one wallet per customer — balance only ever moves via walletService,
// never edit `balance` directly from a controller or the transaction
// ledger below drifts out of sync with the real balance.
//
// refund/cashback-credit only, no "add money" route anywhere — a wallet
// customers could top up with their own money would fall under RBI's
// Prepaid Payment Instrument rules and need a license. Refund-only stays
// outside that.
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