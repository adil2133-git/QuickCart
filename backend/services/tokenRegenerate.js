const jwt = require("jsonwebtoken");

const tokenRegenerate = (req, res) => {
    try {
        const token = req.cookies?.Refresh_Token;

        if (!token) {
            return res.status(401).json({ message: "No refresh token" });
        }

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN);

        const AccessToken = jwt.sign(
            {
                email: decoded.email,
                id:    decoded.id,
                role:  decoded.role,
            },
            process.env.ACCESS_TOKEN,
            { expiresIn: "1m" }
        );

        return res
            .cookie("Access_Token", AccessToken, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            })
            .status(200)
            .json({ message: "Token refreshed" });

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Refresh token expired, please login again" });
        }
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};

module.exports = tokenRegenerate;