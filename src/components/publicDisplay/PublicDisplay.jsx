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

  // For block/unblock
  const [blockedUsers, setBlockedUsers] = useState(
    JSON.parse(localStorage.getItem("blockedUsers")) || []
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
    console.log("Selected Recipient:", recipient);
    setSelectedRecipient(recipient);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="public-display">
      {/* List of conversations & search */}
      <ChatList onSelectRecipient={handleSelectRecipient} />

      {/* Main chat window */}
      <Chat
        recipient={selectedRecipient}
        setSharedFiles={setSharedFiles}
        blockedUsers={blockedUsers}
      />

      {/* Right-side detail panel (avatar, blocking, shared files) */}
      <Detail
        recipient={selectedRecipient}
        sharedFiles={sharedFiles}
        blockedUsers={blockedUsers}
        setBlockedUsers={setBlockedUsers}
      />
    </div>
  );
};

export default PublicDisplay;
