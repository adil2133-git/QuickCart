const WithdrawalRequest = require("../../models/driver/withdrawalRequest");
const driverWalletService = require("../../services/driverWalletService");

// GET /api/admin/driver/withdrawals?status=PENDING
const getWithdrawalRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const requests = await WithdrawalRequest.find(filter)
            .populate({ path: "driverId", select: "userId availableBalance", populate: { path: "userId", select: "name phone email" } })
            .sort({ requestedAt: -1 })
            .limit(100)
            .lean();

        return res.status(200).json({
            success: true,
            withdrawals: requests.map((wr) => ({
                id: wr._id.toString(),
                driverId: wr.driverId?._id?.toString() ?? null,
                driverName: wr.driverId?.userId?.name ?? "Unknown",
                driverPhone: wr.driverId?.userId?.phone ?? null,
                driverAvailableBalance: wr.driverId?.availableBalance ?? 0,
                amount: wr.amount,
                status: wr.status,
                requestedAt: wr.requestedAt,
                reviewedAt: wr.reviewedAt,
                rejectionReason: wr.rejectionReason,
                paidAt: wr.paidAt,
            })),
        });
    } catch (err) {
        console.error("[getWithdrawalRequests]", err);
        return res.status(500).json({ success: false, message: "Failed to load withdrawal requests." });
    }
};

// POST /api/admin/driver/withdrawals/:id/decision  { action: "APPROVE" | "REJECT", rejectionReason? }
const reviewWithdrawalRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, rejectionReason } = req.body;

        if (!["APPROVE", "REJECT"].includes(action)) {
            return res.status(400).json({ success: false, message: "action must be APPROVE or REJECT." });
        }

        const withdrawal = await driverWalletService.reviewWithdrawal({
            withdrawalRequestId: id,
            action,
            adminUserId: req.user.userID,
            rejectionReason,
        });

        return res.status(200).json({
            success: true,
            message: `Withdrawal ${withdrawal.status.toLowerCase()}.`,
            withdrawal: {
                id: withdrawal._id.toString(),
                status: withdrawal.status,
                amount: withdrawal.amount,
                rejectionReason: withdrawal.rejectionReason,
            },
        });
    } catch (err) {
        if (err instanceof driverWalletService.WalletError) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        console.error("[reviewWithdrawalRequest]", err);
        return res.status(500).json({ success: false, message: "Failed to review withdrawal request." });
    }
};

module.exports = { getWithdrawalRequests, reviewWithdrawalRequest };