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
  "http://127.0.0.1:5173", // ✅ Deployed Frontend", // ✅ Deployed Frontend
  "http://localhost:5173", // ✅ Local Vite Frontend
];
// ✅ CORS Fix
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // ✅ Required for cookies & auth
}));

app.use(
  cors({
    origin: allowedOrigins, // ❌ REMOVE "*", Use only allowed origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ✅ Allow cookies & authentication headers
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Home Route - Confirms Successful Deployment
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Node.js backend!" });
});

// Connect to Mongo
const MONGO_URI = process.env.MONGO_URI || "your-default-mongodb-uri";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Socket.io
// ✅ Fix WebSocket CORS Issues
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket", "polling"], // ✅ Support WebSockets & Polling
  },
  allowEIO3: true, // ✅ Allow older WebSocket clients
});

// 👇 Force WebSocket transport
io.engine.on("headers", (headers, req) => {
  headers["Access-Control-Allow-Origin"] = req.headers.origin;
  headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
  headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  headers["Access-Control-Allow-Credentials"] = "true";
});

io.on("connection", (socket) => {
  console.log("✅ New WebSocket Connection:", socket.id);
});

// Debugging WebSocket Connections
io.on("connection", (socket) => {
  console.log("✅ WebSocket Connected:", socket.id);
  
  socket.on("disconnect", (reason) => {
    console.warn("🔌 WebSocket Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ WebSocket Connection Error:", error);
  });
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
