const jwt = require("jsonwebtoken");
require("dotenv").config();

const buildTokenPayload = (email, userID, role) => ({
    email,
    id: userID,
    role
});

const generateToken = (email, userID, role) => {
    const payload = buildTokenPayload(email, userID, role);

    const AccessToken  = jwt.sign(payload, process.env.ACCESS_TOKEN,  { expiresIn: "30m" });
    const RefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, { expiresIn: "7d"  });

    return { AccessToken, RefreshToken };
};

module.exports = generateToken;