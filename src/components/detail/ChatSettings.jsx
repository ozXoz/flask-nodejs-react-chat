import React, { useState, useEffect } from "react";
import socket from "../utils/socket";
import "./chatSettings.css";
import CONFIG from "../utils/config"; // Import our dynamic config

// Re-export block/unblock so Detail can import
export const blockUser = async (userEmail, setBlockedUsers, blockedUsers) => {
  if (!userEmail) return;
  try {
    // <<<<< ADDED: mode: "cors" >>>>>
    const response = await fetch(`${CONFIG.NODE_BACKEND}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocker: localStorage.getItem("email"),
        blocked: userEmail,
      }),
      mode: "cors", // <<<<< ADDED
    });
    const result = await response.json();
    if (response.ok) {
      const updated = [...blockedUsers, userEmail];
      setBlockedUsers(updated);
      localStorage.setItem("blockedUsers", JSON.stringify(updated));
      socket.emit("blockedUsersUpdated");
    } else {
      console.error("[ERROR] blockUser:", result);
    }
  } catch (err) {
    console.error("[ERROR] blockUser:", err);
  }
};

export const unblockUser = async (userEmail, setBlockedUsers, blockedUsers) => {
  if (!userEmail) return;
  try {
    // <<<<< ADDED: mode: "cors" >>>>>
    const response = await fetch(`${CONFIG.NODE_BACKEND}/block/unblock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocker: localStorage.getItem("email"),
        blocked: userEmail,
      }),
      mode: "cors", // <<<<< ADDED
    });
    if (response.ok) {
      const updated = blockedUsers.filter((u) => u !== userEmail);
      setBlockedUsers(updated);
      localStorage.setItem("blockedUsers", JSON.stringify(updated));
      socket.emit("blockedUsersUpdated");
    }
  } catch (err) {
    console.error("[ERROR] unblockUser:", err);
  }
};

const ChatSettings = ({ setAvatar, blockedUsers, setBlockedUsers }) => {
  const [avatarPreview, setAvatarPreview] = useState(
    localStorage.getItem("avatar") || "./avatar.png"
  );
  const [theme, setTheme] = useState(localStorage.getItem("chatTheme") || "light");
   // 1) UseEffect to apply theme to <html>
  //  useEffect(() => {
  //   // This sets <html data-theme="light" or "dark">
  //   document.documentElement.setAttribute("data-theme", theme);
  // }, [theme]);

  // On mount, fetch the blocked user list
  const fetchBlockedUsers = async () => {
    try {
      const email = localStorage.getItem("email");
      if (!email) return;
      // <<<<< ADDED: mode: "cors" >>>>>
      const response = await fetch(
        `${CONFIG.NODE_BACKEND}/block/is-blocked?blocker=${email}`,
        { mode: "cors" }
      );
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blockedUsers || []);
        localStorage.setItem("blockedUsers", JSON.stringify(data.blockedUsers || []));
      } else {
        console.error("[ERROR] fetchBlockedUsers:", response.statusText);
      }
    } catch (err) {
      console.error("[ERROR] fetchBlockedUsers:", err);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();

    // Listen for "blockedUsersUpdated" event
    socket.on("blockedUsersUpdated", fetchBlockedUsers);

    return () => {
      socket.off("blockedUsersUpdated", fetchBlockedUsers);
    };
  }, []);

  // Handle avatar upload


const handleAvatarUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // <<<<< PASS THE USER'S EMAIL in formData >>>>>
  const formData = new FormData();
  formData.append("avatar", file);
  formData.append("email", localStorage.getItem("email")); // <<<<< KEY LINE

  try {
    const response = await fetch(`${CONFIG.NODE_BACKEND}/file/upload-avatar`, {
      method: "POST",
      body: formData,
      mode: "cors", 
    });
    if (response.ok) {
      const data = await response.json();
      setAvatar(data.url);
      setAvatarPreview(data.url);
      localStorage.setItem("avatar", data.url);

      // Notify other tabs
      window.dispatchEvent(new Event("storage"));
    } else {
      console.error("[ERROR] handleAvatarUpload: upload failed");
    }
  } catch (err) {
    console.error("[ERROR] handleAvatarUpload:", err);
  }
};


  // Change theme
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem("chatTheme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="chat-settings">
      <h2>Chat Settings</h2>

      <div className="avatar-section">
        <h3>Profile Picture</h3>
        {/* <<<<< ADDED crossOrigin="anonymous" to help with image blocking >>>>> */}
        <img
          src={avatarPreview}
          alt="Avatar"
          className="avatar-img"
          crossOrigin="anonymous"
        />
        <input type="file" onChange={handleAvatarUpload} accept="image/*" />
      </div>

      <div className="theme-section">
        <h3>Chat Theme</h3>
        <select onChange={handleThemeChange} value={theme}>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      </div>
    </div>
  );
};

export default ChatSettings;
