const jwt = require("jsonwebtoken");
const { ACCESS_COOKIE_OPTIONS } = require("../utils/cookieOptions");

// Refreshes the access token cookie using a valid refresh token cookie
const tokenRegenerate = (req, res) => {
    try {
        const token = req.cookies?.Refresh_Token;

        if (!token) {
            return res.status(401).json({
                title: "Session Expired",
                message: "Please log in to continue.",
            });
        }

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN);

        const AccessToken = jwt.sign(
            {
                email: decoded.email,
                id: decoded.id,
                role: decoded.role,
            },
            process.env.ACCESS_TOKEN,
            { expiresIn: "15m" }
        );

        return res
            .cookie("Access_Token", AccessToken, ACCESS_COOKIE_OPTIONS)
            .status(200)
            .json({ message: "Token refreshed" });

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                title: "Session Expired",
                message: "Your session has expired. Please log in again.",
            });
        }
        return res.status(401).json({
            title: "Session Expired",
            message: "Your session is invalid. Please log in again.",
        });
    }
};

module.exports = tokenRegenerate;