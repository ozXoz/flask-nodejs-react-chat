// controllers/chatController.js
// <<<<< ENTIRE FILE WITH DUPLICATE uploadFile REMOVED & SUBFOLDER /files ADDED >>>>>

const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const BlockedUser = require("../models/BlockedUser");

// Fetch messages for a specific chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required." });
    }

    const messages = await Message.find({ chatId }).sort("timestamp");
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Unable to fetch messages" });
  }
};

// Save a new message
exports.saveMessage = async (req, res) => {
  const { sender, recipient, message, chatId, file } = req.body;

  if (!sender || !recipient || !chatId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // Check if either user has blocked the other
    const senderBlockedRecipient = await BlockedUser.findOne({
      blocker: sender,
      blocked: recipient,
    });
    const recipientBlockedSender = await BlockedUser.findOne({
      blocker: recipient,
      blocked: sender,
    });

    if (senderBlockedRecipient) {
      return res
        .status(403)
        .json({
          error: `You have blocked ${recipient}. Unblock them to send messages.`,
        });
    }

    if (recipientBlockedSender) {
      return res
        .status(403)
        .json({ error: `You are blocked by ${recipient}.` });
    }

    // Save the message
    const newMessage = new Message({
      sender,
      recipient,
      message: message || "",
      chatId,
      timestamp: new Date(),
      file: file || null,
    });

    await newMessage.save();
    console.log("[INFO] Message saved:", newMessage);

    res.status(201).json(newMessage);

    // Optionally broadcast to Socket.io if you'd like:
    // io.emit("receiveMessage", newMessage);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Unable to save message." });
  }
};

// Get conversations
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

/**
 * Upload a file (images, pdf, etc.)
 * <<<<< SINGLE DEFINITON with 'files' subfolder >>>>>
 */
exports.uploadFile = (req, res) => {
  try {
    // Check the MIME type to determine "image" vs "pdf"
    const fileType = req.file.mimetype.startsWith("image/") ? "image" : "pdf";

    // <<<<< CHANGED: includes "/files" subfolder in the URL >>>>>
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/files/${req.file.filename}`;

    res.status(200).json({
      message: "File uploaded successfully",
      file: {
        name: req.file.originalname,
        url: fileUrl,
        type: fileType, // e.g. "image" or "pdf"
      },
    });
  } catch (err) {
    console.error("File upload failed:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};
