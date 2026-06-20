// middleware/authorizeRoles.js
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: "Unauthorized, please login first" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied: admins only" });
        }

        next();
    };
};

module.exports = authorizeRoles;