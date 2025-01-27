import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000"; // Replace with your backend URL if deployed

const socket = io(SOCKET_URL);

export default socket;
