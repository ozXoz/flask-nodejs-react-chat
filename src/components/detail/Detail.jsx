import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatSettings from "../detail/ChatSettings";
import "./detail.css";

const Detail = ({ sharedFiles, blockedUsers, setBlockedUsers }) => { // ✅ Accept blockedUsers props
  console.log("Detail component is rendering");

  const [openSections, setOpenSections] = useState({
    chatSettings: false,
    privacyHelp: false,
    sharedPhotos: false,
  });

  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "./avatar.png");

  const navigate = useNavigate();

  // Toggle section visibility
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle logout functionality
  const handleLogout = () => {
    localStorage.removeItem("email");
    localStorage.removeItem("nickname");
    localStorage.removeItem("token");
    localStorage.removeItem("avatar");
    navigate("/login");
  };

  return (
    <div className="detail">
      <div className="user">
        <img src={avatar} alt="User Avatar" className="user-avatar" />
        <h2>Oz Korkmaz</h2>
        <p>Pellentesque habitant morbi</p>
      </div>

      <div className="info">
        {/* Chat Settings */}
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
              blockedUsers={blockedUsers}  // ✅ Pass blockedUsers
              setBlockedUsers={setBlockedUsers}  // ✅ Pass setBlockedUsers
            />
          )}
        </div>

        {/* Privacy & Help */}
        <div className="option">
          <div className="title" onClick={() => toggleSection("privacyHelp")}>
            <span>Privacy & Help</span>
            <img
              src={openSections.privacyHelp ? "./arrowDown.png" : "./arrowUp.png"}
              alt="Toggle Arrow"
            />
          </div>
          {openSections.privacyHelp && (
            <div className="content">
              <p>Your privacy is our priority...</p>
            </div>
          )}
        </div>

        {/* Shared Files */}
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
                sharedFiles.map((file, index) => (
                  <div key={index} className="photoItem">
                    <div className="fileDetail">
                      {file.type.startsWith("image") ? (
                        <img src={file.url} alt="Shared" className="shared-img" />
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

      <button className="block">Block User</button>
      <button className="logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Detail;
