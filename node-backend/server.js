const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const chatRoutes = require("./routes/chatRoutes");
const fileRoutes = require("./routes/fileRoutes");
const blockRoutesFactory = require("./routes/blockRoutes");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`🚨 Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Mongo
const MONGO_URI = process.env.MONGO_URI || "your-default-mongodb-uri";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Optionally export io if you want to use it in controllers
// module.exports.io = io;

// Create blockController & blockRoutes with the io instance
const blockRoutes = blockRoutesFactory(io);

// WebSocket events
io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // If you want Node to handle sending messages in real-time:
  socket.on("sendMessage", (msgData) => {
    // console.log("[SOCKET] Message received:", msgData);
    // Then broadcast
    io.emit("receiveMessage", msgData);
  });

  socket.on("disconnect", () => console.log("👋 User disconnected:", socket.id));
});

// Define routes
app.use("/chat", chatRoutes);
app.use("/file", fileRoutes);
app.use("/block", blockRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
