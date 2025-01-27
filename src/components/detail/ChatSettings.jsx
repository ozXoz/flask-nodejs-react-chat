import React, { useState } from "react";
import "./chatSettings.css";

const ChatSettings = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);

  const blockUser = (user) => {
    setBlockedUsers((prev) => [...prev, user]);
    alert(`${user} has been blocked`);
  };

  return (
    <div className="chat-settings">
      <h2>Chat Settings</h2>
      <button onClick={() => blockUser("User123")}>Block User123</button>
      <div>
        <h3>Blocked Users:</h3>
        {blockedUsers.map((user, index) => (
          <p key={index}>{user}</p>
        ))}
      </div>
    </div>
  );
};

export default ChatSettings;
