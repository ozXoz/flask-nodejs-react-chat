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

// Keep track of which user email (or ID) is tied to which socket
// Keep track of which user email (or ID) is tied to which socket
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // When the user joins, store a mapping from `userEmail` -> `socket.id`
  socket.on("joinCall", (userEmail) => {
    userSocketMap[userEmail] = socket.id;
    console.log(`[joinCall] ${userEmail} mapped to socket ${socket.id}`);
  });

  /**
   * 1) Caller sends "callUser" with { offer, to, from }
   *    "to" is the target userEmail
   *    "from" is the caller's userEmail
   */
  socket.on("callUser", ({ offer, to, from }) => {
    const targetSocket = userSocketMap[to];
    if (!targetSocket) {
      console.log("[callUser] Target user is not online");
      // You could emit back to caller that user not found:
      return;
    }
    console.log(`[callUser] from=${from} to=${to}`);

    // Pass the offer to the target
    io.to(targetSocket).emit("callMade", { offer, from });
  });

  /**
   * 2) Callee answers with "answerCall" { answer, to (callerEmail), from (calleeEmail) }
   */
  socket.on("answerCall", ({ answer, to, from }) => {
    const targetSocket = userSocketMap[to];
    if (!targetSocket) {
      console.log("[answerCall] Caller is not online anymore");
      return;
    }
    console.log(`[answerCall] from=${from} to=${to}`);
    // Pass the answer back to the caller
    io.to(targetSocket).emit("callAnswered", { answer, from });
  });

  /**
   * 3) Exchange ICE Candidates
   *    "iceCandidate" { candidate, to, from }
   */
  socket.on("iceCandidate", ({ candidate, to, from }) => {
    const targetSocket = userSocketMap[to];
    if (!targetSocket) return;
    // Pass the ICE candidate along
    io.to(targetSocket).emit("iceCandidate", { candidate, from });
  });

  /**
   * 4) End call
   */
  socket.on("endCall", ({ to, from }) => {
    const targetSocket = userSocketMap[to];
    if (targetSocket) {
      io.to(targetSocket).emit("callEnded", { from });
    }
  });

  // Cleanup if user disconnects
  socket.on("disconnect", () => {
    console.log("👋 User disconnected:", socket.id);

    // Optionally remove from userSocketMap
    for (const [email, sockId] of Object.entries(userSocketMap)) {
      if (sockId === socket.id) {
        delete userSocketMap[email];
        break;
      }
    }
  });
});



// Define routes
app.use("/chat", chatRoutes);
app.use("/file", fileRoutes);
app.use("/block", blockRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
