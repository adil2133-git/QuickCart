/**
 * Middleware to restrict route access to specific user roles.
 * @param {...string} allowedRoles - The roles permitted to access the route.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: "Unauthorized, please login first" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied: insufficient permissions" });
        }

        next();
    };
};

module.exports = authorizeRoles;