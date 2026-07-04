const User = require("../../models/shared/user");

const getMe = async (req, res) => {
    try {
        // protectRoute already verified the token and set req.user
        const user = await User.findById(req.user.userID).select("name email role status");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,     // CUSTOMER | ADMIN | DRIVER | STORE
                status: user.status, // ACTIVE | PENDING_APPROVAL | etc.
            },
        });
    } catch (err) {
        console.error("[getMe]", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getMe };