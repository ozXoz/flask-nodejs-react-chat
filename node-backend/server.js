const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chatRoutes');
const fileRoutes = require('./routes/fileRoutes');
const Message = require('./models/Message'); // Import the Message model
const Conversation = require('./models/Conversation'); // Import the Conversation model

// Initialize app and server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Replace with your frontend's URL for better security
  },
});

// Load environment variables
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI || 'your-default-mongodb-uri';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });

// Real-time communication using Socket.IO
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('sendMessage', async (msgData) => {
    const { sender, recipient, message, chatId } = msgData;

    if (!sender || !recipient || !message || !chatId) {
      console.error('Missing required fields:', { sender, recipient, message, chatId });
      return;
    }

    try {
      // Save the message
      const newMessage = new Message(msgData);
      await newMessage.save();

      // Update or create conversation for both users
      await Promise.all([
        Conversation.findOneAndUpdate(
          { user: sender, participant: recipient },
          { chatId, lastMessage: message, timestamp: new Date() },
          { upsert: true, new: true }
        ),
        Conversation.findOneAndUpdate(
          { user: recipient, participant: sender },
          { chatId, lastMessage: message, timestamp: new Date() },
          { upsert: true, new: true }
        ),
      ]);

      console.log('Message saved and conversation updated:', newMessage);

      // Emit the message to the recipient
      io.emit('receiveMessage', newMessage);
    } catch (err) {
      console.error('Error saving message or updating conversation:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// REST API routes
app.use('/chat', chatRoutes);
app.use('/file', fileRoutes);

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Node.js backend running on port ${PORT}`);
});
