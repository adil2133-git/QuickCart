const express = require("express");
const router = express.Router();
const protectRoutes = require("../../middleware/protectRoutes");
const Notification = require("../../models/shared/notification");

// GET /api/notifications
router.get("/", protectRoutes, async (req, res) => {
    try {
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ userId: req.user.userID })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
            Notification.countDocuments({ userId: req.user.userID, isRead: false }),
        ]);
        return res.status(200).json({ success: true, notifications, unreadCount });
    } catch {
        return res.status(500).json({ success: false, message: "Failed to fetch notifications." });
    }
});

// PATCH /api/notifications/read-all  ← must come before /:id/read
router.patch("/read-all", protectRoutes, async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.userID, isRead: false }, { isRead: true });
        return res.status(200).json({ success: true });
    } catch {
        return res.status(500).json({ success: false, message: "Failed." });
    }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", protectRoutes, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userID },
            { isRead: true }
        );
        return res.status(200).json({ success: true });
    } catch {
        return res.status(500).json({ success: false, message: "Failed." });
    }
});

// DELETE /api/notifications/:id
router.delete("/:id", protectRoutes, async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.userID });
        return res.status(200).json({ success: true });
    } catch {
        return res.status(500).json({ success: false, message: "Failed." });
    }
});

module.exports = router;