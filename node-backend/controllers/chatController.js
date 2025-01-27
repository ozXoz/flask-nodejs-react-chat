const Message = require("../models/Message"); // Import your Message model

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

  // Validate required fields
  if (!sender || !recipient || !message || !chatId) {
    console.error("Missing required fields:", { sender, recipient, message, chatId });
    return res.status(400).json({ error: "Missing required fields: sender, recipient, message, or chatId." });
  }

  try {
    const newMessage = new Message({ sender, recipient, message, chatId, timestamp: new Date() });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Unable to save message" });
  }
};

