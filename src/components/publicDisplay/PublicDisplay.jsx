import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatList from "../list/chatList/ChatList";
import Chat from "../chat/Chat";
import Detail from "../detail/Detail";
import "./publicDisplay.css";

const PublicDisplay = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState(
    JSON.parse(localStorage.getItem("blockedUsers")) || [] // ✅ Load from localStorage
  );

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="public-display">
      <ChatList onSelectRecipient={handleSelectRecipient} />
      <Chat recipient={selectedRecipient} setSharedFiles={setSharedFiles} blockedUsers={blockedUsers} /> {/* ✅ Pass blockedUsers */}
      <Detail sharedFiles={sharedFiles} blockedUsers={blockedUsers} setBlockedUsers={setBlockedUsers} /> {/* ✅ Ensure Detail updates blockedUsers */}
    </div>
  );
};

export default PublicDisplay;
