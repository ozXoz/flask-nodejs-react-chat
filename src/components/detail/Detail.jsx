import React, { useState } from "react";
import "./detail.css";

const Detail = () => {
  console.log("Detail component is rendering");
  const [openSections, setOpenSections] = useState({
    chatSettings: false,
    privacyHelp: false,
    sharedPhotos: false,
  });

  // Toggle section visibility
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],  
    }));
  };

  return (
    <div className="detail">
      <div className="user">
        <img src="./avatar.png" alt="User Avatar" />
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
            <div className="content">
              <p>Customize your chat settings here.</p>
            </div>
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
              <p>Find privacy settings and help resources.</p>
            </div>
          )}
        </div>

        {/* Shared Photos */}
        <div className="option">
          <div className="title" onClick={() => toggleSection("sharedPhotos")}>
            <span>Shared Photos</span>
            <img
              src={openSections.sharedPhotos ? "./arrowDown.png" : "./arrowUp.png"}
              alt="Toggle Arrow"
            />
          </div>
          {openSections.sharedPhotos && (
            <div className="photos">
              <div className="photoItem">
                <div className="phoneDetail">
                  <img
                    src="https://static.scientificamerican.com/sciam/cache/file/3198624E-C54D-458C-BB35B9DECED8F27D_source.jpg?crop=16%3A9%2Csmart&w=1920"
                    alt=""
                  />
                  <span>Phone_2024_2.png</span>
                </div>
                <img src="./download.png" alt="Download Icon" className="icons" />
              </div>
              <div className="photoItem">
                <div className="phoneDetail">
                  <img
                    src="https://static.scientificamerican.com/sciam/cache/file/3198624E-C54D-458C-BB35B9DECED8F27D_source.jpg?crop=16%3A9%2Csmart&w=1920"
                    alt=""
                  />
                  <span>Phone_2024_3.png</span>
                </div>
                <img src="./download.png" alt="Download Icon" className="icons" />
              </div>
            </div>
          )}
        </div>
      </div>
      <button className="block">Block User</button>
      <button className="logout">Logout</button>
    </div>
  );
};

export default Detail;
