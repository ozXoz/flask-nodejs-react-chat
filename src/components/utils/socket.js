import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000"; // or your Node server URL

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

// Listen for block/unblock events
socket.on("blockedUsersUpdated", () => {
  console.log("[SOCKET] Blocked users list updated - Fetching new data...");
  window.dispatchEvent(new Event("blockedUsersUpdated"));
});

export default socket;
