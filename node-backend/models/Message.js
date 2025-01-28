const mongoose = require('mongoose');

// Message Schema
const MessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true }, // Unique identifier for a conversation
  sender: { type: String, required: true }, // Nickname of the sender
  email: { type: String, required: true }, // Email of the sender
  recipient: { type: String, required: true }, // Nickname or email of the recipient
  message: { type: String, required: true }, // Content of the message
  timestamp: { type: Date, default: Date.now }, // Time the message was sent
});

// Add index for faster query performance
MessageSchema.index({ chatId: 1, timestamp: 1 });
// Export the Message model
module.exports = mongoose.model('Message', MessageSchema);
