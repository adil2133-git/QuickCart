const bcrypt = require("bcryptjs");
const User = require("../../models/shared/user");
const generateToken = require("../../utils/generateToken"); 

const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const lowerEmail = email.toLowerCase();

        const user = await User.findOne({ email: lowerEmail });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.blocked) {
            return res.status(403).json({ message: "Your account has been blocked" });
        }

        const { AccessToken, RefreshToken } = generateToken(user.email, user._id, user.role);

        res
            .cookie("Access_Token", AccessToken, {
                httpOnly: true,
                sameSite: "none",
                secure: true
            })
            .cookie("Refresh_Token", RefreshToken, {
                httpOnly: true,
                sameSite: "none",
                secure: true
            })
            .status(200)
            .json({
                message: "Login successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role   // frontend uses this to redirect
                }
            });

    } catch (err) {
        console.log("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Internal server error", Error: err.message });
    }
};

module.exports = { Login };