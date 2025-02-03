import { io } from "socket.io-client";
import CONFIG from "./config"; // ✅ Import backend config

const socket = io(CONFIG.NODE_BACKEND, {
  withCredentials: true, // ✅ Allow credentials (cookies, tokens)
  transports: ["polling", "websocket"], // ✅ Use polling first, then WebSockets
  reconnection: true, 
  reconnectionAttempts: 5, 
  reconnectionDelay: 3000, 
});

socket.on("connect", () => {
  console.log("✅ WebSocket Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.warn("🔌 WebSocket Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ WebSocket Connection Error:", error);
});

export default socket;
