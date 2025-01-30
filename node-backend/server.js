const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const chatRoutes = require("./routes/chatRoutes");
const fileRoutes = require("./routes/fileRoutes");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with frontend URL for security
  },
});

// Load environment variables
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI || "your-default-mongodb-uri";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Socket.IO for real-time messages
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("sendMessage", async (msgData) => {
    const { sender, recipient, chatId, email, message, file } = msgData;

    if (!sender || !recipient || !chatId || !email || (!message.trim() && !file)) {
      console.error("Missing required fields:", msgData);
      return;
    }

    try {
      const newMessage = new Message({
        chatId,
        sender,
        recipient,
        email,
        message: message || "",
        file: file ? { name: file.name, url: file.url, type: file.type } : null,
        timestamp: new Date(),
      });

      await newMessage.save();
      console.log("Message saved:", newMessage);

      io.emit("receiveMessage", newMessage);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => console.log("A user disconnected:", socket.id));
});

// ✅ REST API Routes
app.use("/chat", chatRoutes);
app.use("/file", fileRoutes);
app.use("/uploads", express.static("uploads")); // ✅ Serve uploaded files

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
