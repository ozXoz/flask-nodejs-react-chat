import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatSettings, { blockUser, unblockUser } from "./ChatSettings";
import "./detail.css";

import CONFIG from "../utils/config"; // Import our dynamic config



const Detail = ({ recipient, sharedFiles, blockedUsers, setBlockedUsers }) => {
  const [openSections, setOpenSections] = useState({
    chatSettings: false,
    sharedPhotos: false,
  });

  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "./avatar.png");

  useEffect(() => {
    const handleStorageChange = () => {
      const newAvatar = localStorage.getItem("avatar") || "./avatar.png";
      setAvatar(newAvatar);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [isBlocked, setIsBlocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (recipient && blockedUsers.length > 0) {
      setIsBlocked(blockedUsers.includes(recipient.participant));
    }
  }, [recipient, blockedUsers]);

  const refetchBlockedUsers = async () => {
    try {
      const email = localStorage.getItem("email");
      // <<<<< ADDED: mode: "cors" >>>>>
      const response = await fetch(`${CONFIG.NODE_BACKEND}/block/is-blocked?blocker=${email}`, {
        mode: "cors",
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blockedUsers || []);
        localStorage.setItem("blockedUsers", JSON.stringify(data.blockedUsers || []));
      }
    } catch (err) {
      console.error("[ERROR] fetchBlockedUsers:", err);
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = () => {
    localStorage.removeItem("email");
    localStorage.removeItem("nickname");
    localStorage.removeItem("access_token");
    localStorage.removeItem("avatar");
    navigate("/login");
  };

  const handleBlockToggle = async () => {
    if (!recipient || !recipient.participant) return;
    try {
      if (isBlocked) {
        await unblockUser(recipient.participant, setBlockedUsers, blockedUsers);
      } else {
        await blockUser(recipient.participant, setBlockedUsers, blockedUsers);
      }
      // Force re-fetch
      await refetchBlockedUsers();
      window.dispatchEvent(new Event("blockedUsersUpdated"));
    } catch (err) {
      console.error("[ERROR] handleBlockToggle:", err);
    }
  };

  return (
    <div className="detail">
      <div className="user">
        {/* <<<<< ADDED crossOrigin="anonymous" >>>>> */}
        <img src={avatar} alt="User Avatar" className="user-avatar" crossOrigin="anonymous" />
        <h2>Your Profile</h2>
        <p>Subtitle here ...</p>
      </div>

      <div className="info">
        <div className="option">
          <div className="title" onClick={() => toggleSection("chatSettings")}>
            <span>Chat Settings</span>
            <img
              src={openSections.chatSettings ? "./arrowDown.png" : "./arrowUp.png"}
              alt="Toggle Arrow"
            />
          </div>
          {openSections.chatSettings && (
            <ChatSettings
              setAvatar={setAvatar}
              blockedUsers={blockedUsers}
              setBlockedUsers={setBlockedUsers}
            />
          )}
        </div>

        <div className="option">
          <div className="title" onClick={() => toggleSection("sharedPhotos")}>
            <span>Shared Files</span>
            <img
              src={openSections.sharedPhotos ? "./arrowDown.png" : "./arrowUp.png"}
              alt="Toggle Arrow"
            />
          </div>
          {openSections.sharedPhotos && (
            <div className="photos">
              {sharedFiles.length > 0 ? (
                sharedFiles.map((file, i) => (
                  <div key={i} className="photoItem">
                    <div className="fileDetail">
                      {file.type.startsWith("image") ? (
                        // crossOrigin is optional for <img> here
                        <img
                          src={file.url}
                          alt="Shared"
                          className="shared-img"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <embed src={file.url} type={file.type} className="shared-pdf" />
                      )}
                      <span>{file.name}</span>
                    </div>
                    <a href={file.url} download className="download-icon">
                      <img src="./download.png" alt="Download Icon" />
                    </a>
                  </div>
                ))
              ) : (
                <p>No shared files yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {recipient && recipient.participant ? (
        <button className="block" onClick={handleBlockToggle}>
          {isBlocked ? "Unblock User" : "Block User"}
        </button>
      ) : (
        <p className="error-message">Select a recipient to enable blocking.</p>
      )}

      <button className="logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Detail;
