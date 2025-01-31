const mongoose = require("mongoose");

const BlockedUserSchema = new mongoose.Schema({
  blocker: { type: String, required: true }, // The user who blocks
  blocked: { type: String, required: true }, // The user being blocked
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BlockedUser", BlockedUserSchema);
