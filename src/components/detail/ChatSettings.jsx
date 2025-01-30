import React, { useState, useEffect } from "react";
import "./chatSettings.css";

const ChatSettings = ({ setAvatar, blockedUsers = [], setBlockedUsers }) => { 
  const [avatarPreview, setAvatarPreview] = useState(localStorage.getItem("avatar") || "./avatar.png");
  const [theme, setTheme] = useState(localStorage.getItem("chatTheme") || "light");
  const [localBlockedUsers, setLocalBlockedUsers] = useState([]);

  // ✅ Load blocked users from localStorage on mount
  useEffect(() => {
    const storedBlockedUsers = JSON.parse(localStorage.getItem("blockedUsers")) || [];
    setLocalBlockedUsers(storedBlockedUsers);
    setBlockedUsers(storedBlockedUsers);
  }, [setBlockedUsers]);

  // ✅ Handle Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("avatar", file);
  
    try {
      const response = await fetch("http://127.0.0.1:4000/file/upload-avatar", { // ✅ Fixed endpoint
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        setAvatar(data.url);
        setAvatarPreview(data.url);
        localStorage.setItem("avatar", data.url);
        window.dispatchEvent(new Event("storage")); // ✅ Trigger update in ChatList
      } else {
        console.error("Failed to upload avatar");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };
  

  // ✅ Handle Blocking User
  const blockUser = (user) => {
    if (!localBlockedUsers.includes(user)) {
      const updatedBlockedUsers = [...localBlockedUsers, user];
      setLocalBlockedUsers(updatedBlockedUsers);
      setBlockedUsers(updatedBlockedUsers);
      localStorage.setItem("blockedUsers", JSON.stringify(updatedBlockedUsers));
      alert(`${user} has been blocked`);
    }
  };

  // ✅ Handle Unblocking User
  const unblockUser = (user) => {
    const updatedBlockedUsers = localBlockedUsers.filter((u) => u !== user);
    setLocalBlockedUsers(updatedBlockedUsers);
    setBlockedUsers(updatedBlockedUsers);
    localStorage.setItem("blockedUsers", JSON.stringify(updatedBlockedUsers));
    alert(`${user} has been unblocked`);
  };

  // ✅ Handle Theme Change
  const changeTheme = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem("chatTheme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  };

  return (
    <div className="chat-settings">
      <h2>Chat Settings</h2>

      {/* ✅ Avatar Upload Section */}
      <div className="avatar-section">
        <h3>Profile Picture</h3>
        <img src={avatarPreview} alt="Avatar" className="avatar-img" />
        <input type="file" onChange={handleAvatarUpload} accept="image/*" />
      </div>

      {/* ✅ Theme Selection Section */}
      <div className="theme-section">
        <h3>Chat Theme</h3>
        <select onChange={(e) => changeTheme(e.target.value)} value={theme}>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      </div>

      {/* ✅ Block User Section */}
      <div className="block-user-section">
        <h3>Block Users</h3>
        <button onClick={() => blockUser("User123")}>Block User123</button>
        <div>
          <h4>Blocked Users:</h4>
          {localBlockedUsers.length > 0 ? (
            localBlockedUsers.map((user, index) => (
              <div key={index} className="blocked-user">
                <p>{user}</p>
                <button onClick={() => unblockUser(user)} className="unblock-btn">Unblock</button>
              </div>
            ))
          ) : (
            <p>No blocked users</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;
