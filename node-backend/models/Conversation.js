const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Email or nickname of the user
  participant: { type: String, required: true }, // Email or nickname of the participant
  chatId: { type: String, required: true }, // Links messages to the conversation
  lastMessage: { type: String, required: false }, // Content of the last message in the conversation
  timestamp: { type: Date, default: Date.now }, // Time of the last message
}, { timestamps: true }); // Automatically add createdAt and updatedAt

// Add index for faster query performance
ConversationSchema.index({ user: 1, participant: 1 });

// Export the Conversation model
module.exports = mongoose.model('Conversation', ConversationSchema);
