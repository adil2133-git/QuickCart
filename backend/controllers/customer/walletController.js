const CustomerWallet = require("../../models/customer/customerWallet");
const CustomerWalletTransaction = require("../../models/customer/customerWalletTransaction");
const { resolveCustomerProfile } = require("../../services/customerProfileService");

// ─── GET /api/customer/wallet ─────────────────────────────────────────────────
// Returns current balance + recent transaction history, newest first.
const getWallet = async (req, res) => {
    try {
        const profile = await resolveCustomerProfile(req.user.userID);

        const wallet = await CustomerWallet.findOne({ customerId: profile._id }).lean();
        const transactions = await CustomerWalletTransaction.find({ customerId: profile._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("orderId", "orderNumber")
            .lean();

        return res.status(200).json({
            success: true,
            balance: wallet?.balance ?? 0,
            transactions: transactions.map((t) => ({
                id: t._id.toString(),
                amount: t.amount,
                type: t.type,
                description: t.description,
                orderNumber: t.orderId?.orderNumber ?? null,
                createdAt: t.createdAt,
            })),
        });
    } catch (err) {
        console.error("GET WALLET ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = { getWallet };