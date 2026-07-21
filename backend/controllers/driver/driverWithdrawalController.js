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


module.exports = { getWithdrawalRequests, reviewWithdrawalRequest };