const jwt = require("jsonwebtoken");
const User = require("../models/shared/user");
require("dotenv").config();

/**
 * Middleware to verify access token (from cookies, headers, or query parameters)
 * and attach user profile credentials to the request.
 */
const protectRoutes = async (req, res, next) => {
    try {
        let token =
            req.cookies?.Access_Token ||
            req.headers["x-access-token"] ||
            req.query?.token;

        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        if (!token) {
            return res.status(401).json({ message: "Unauthorized, please login first" });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.blocked) {
            return res.status(403).json({ message: "Your account has been blocked" });
        }

        req.user = {
            email: decoded.email,
            userID: decoded.id,
            role: decoded.role,
        };

        next();

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Access token expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = protectRoutes;