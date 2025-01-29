const Message = require("../models/Message"); // Import your Message model
const Conversation = require('../models/Conversation'); // Import the Conversation model
// Fetch messages for a specific chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Validate chatId
    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required." });
    }

    // Fetch messages for the chatId
    const messages = await Message.find({ chatId }).sort("timestamp");
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Unable to fetch messages" });
  }
};

// Save a new message
exports.saveMessage = async (req, res) => {
  const { sender, recipient, message, chatId } = req.body;

  if (!sender || !recipient || !message || !chatId) {
    console.error("Missing required fields:", { sender, recipient, message, chatId });
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // Save the new message
    const newMessage = new Message({
      sender,
      recipient,
      message,
      chatId,
      timestamp: new Date(),
    });
    await newMessage.save();

    // Create or update conversation for the sender
    const senderConversation = await Conversation.findOneAndUpdate(
      { user: sender, participant: recipient },
      { chatId, lastMessage: message, timestamp: new Date() },
      { upsert: true, new: true }
    );

    // Create or update conversation for the recipient
    const recipientConversation = await Conversation.findOneAndUpdate(
      { user: recipient, participant: sender },
      { chatId, lastMessage: message, timestamp: new Date() },
      { upsert: true, new: true }
    );

    console.log("[INFO] Message saved and conversations updated.");
    res.status(201).json(newMessage);

    // Emit updates to both participants
    io.emit("newConversation", senderConversation);
    io.emit("newConversation", recipientConversation);
  } catch (err) {
    console.error("Error saving message or updating conversation:", err);
    res.status(500).json({ error: "Unable to save message." });
  }
};



exports.getConversations = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const conversations = await Conversation.find({
      $or: [{ user: email }, { participant: email }],
    }).sort("-timestamp");

    res.status(200).json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Unable to fetch conversations" });
  }
};


