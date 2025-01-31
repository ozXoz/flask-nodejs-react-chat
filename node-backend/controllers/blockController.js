const BlockedUser = require("../models/BlockedUser");

module.exports = (io) => {
  return {
    // Block a user
    blockUser: async (req, res) => {
      try {
        const { blocker, blocked } = req.body;

        if (!blocker || !blocked) {
          return res.status(400).json({ error: "Both users are required." });
        }

        const alreadyBlocked = await BlockedUser.findOne({ blocker, blocked });
        if (alreadyBlocked) {
          return res.status(400).json({ error: "User is already blocked." });
        }

        await new BlockedUser({ blocker, blocked }).save();

        console.log("[SUCCESS] User blocked:", req.body);

        io.emit("blockedUsersUpdated", { blocker, blocked, action: "block" });
        res.status(201).json({ message: "User blocked successfully." });
      } catch (err) {
        console.error("[ERROR] Error blocking user:", err);
        res.status(500).json({ error: "Unable to block user." });
      }
    },

    // Unblock a user
    unblockUser: async (req, res) => {
      try {
        const { blocker, blocked } = req.body;

        if (!blocker || !blocked) {
          return res.status(400).json({ error: "Both users are required." });
        }

        await BlockedUser.findOneAndDelete({ blocker, blocked });

        console.log("[SUCCESS] User unblocked:", req.body);

        io.emit("blockedUsersUpdated", { blocker, blocked, action: "unblock" });
        res.status(200).json({ message: "User unblocked successfully." });
      } catch (err) {
        console.error("[ERROR] Error unblocking user:", err);
        res.status(500).json({ error: "Unable to unblock user." });
      }
    },

    // Check if a user is blocked
    isBlocked: async (req, res) => {
      try {
        const { blocker } = req.query;
        if (!blocker) {
          return res.status(400).json({ error: "Blocker email is required." });
        }

        const blockedUsers = await BlockedUser.find({ blocker }).select("blocked -_id");
        res.status(200).json({ blockedUsers: blockedUsers.map(u => u.blocked) });
      } catch (err) {
        console.error("[ERROR] Checking blocked users:", err);
        res.status(500).json({ error: "Unable to fetch blocked users." });
      }
    },
  };
};
