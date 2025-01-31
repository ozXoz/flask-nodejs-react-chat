const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
  // email: { type: String, required: true },
  message: { 
    type: String, 
    required: function() { return !this.file; }  // ✅ Required if no file
  },
  file: {
    name: { type: String },
    url: { type: String },
    type: { type: String }
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);
