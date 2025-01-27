const mongoose = require('mongoose');

// Conversation Schema
const ConversationSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Email or nickname of the user
  participant: { type: String, required: true }, // Email or nickname of the participant
  chatId: { type: String, required: true }, // Links messages to the conversation
  lastMessage: { type: String, required: true }, // Content of the last message in the conversation
  timestamp: { type: Date, default: Date.now }, // Time of the last message
});

// Export the Conversation model
module.exports = mongoose.model('Conversation', ConversationSchema);
