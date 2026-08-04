/**
 * Middleware requiring STORE or DRIVER accounts to have status "ACTIVE".
 * Allows /me endpoints through so pending/rejected screens can fetch status,
 * but blocks operational API calls if the account is PENDING_APPROVAL or REJECTED.
 */
const requireActiveStatus = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized, please login first" });
    }

    if (["DRIVER", "STORE"].includes(req.user.role)) {
        if (req.user.status && req.user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: `Access denied: Your account is currently ${req.user.status.toLowerCase().replace("_", " ")}. Approval is required.`,
                status: req.user.status,
            });
        }
    }

    next();
};

module.exports = requireActiveStatus;
