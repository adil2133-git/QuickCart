const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper to construct the standard JWT payload
const buildTokenPayload = (email, userID, role) => ({
    email,
    id: userID,
    role
});

/**
 * Generates short-lived access tokens and long-lived refresh tokens 
 * for user sessions.
 */
const generateToken = (email, userID, role) => {
    const payload = buildTokenPayload(email, userID, role);

    const AccessToken  = jwt.sign(payload, process.env.ACCESS_TOKEN,  { expiresIn: "15m" });
    const RefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, { expiresIn: "7d"  });

    return { AccessToken, RefreshToken };
};

module.exports = generateToken;