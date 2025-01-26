import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import "./chat.css";

const Chat = () => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const endRef = useRef(null); // Correctly initialize endRef

    // Automatically scroll to the bottom of the chat
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [text]); // Add 'text' as dependency to scroll on every new input

    const handleEmojiClick = (emojiData) => {
        setText((prevText) => prevText + emojiData.emoji);
        console.log("Emoji clicked:", emojiData.emoji);
    };

    const handleInputChange = (e) => {
        setText(e.target.value);
        console.log("User typed:", e.target.value);
    };

    return (
        <div className="chat">
            {/* Top Header */}
            <div className="top">
                <div className="user">
                    <img src="./avatar.png" alt="Avatar" className="avatar" />
                    <div className="texts">
                        <span className="name">Oz Korkmaz</span>
                        <p className="message">Lorem ipsum dolor, sit amet.</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="Phone" className="icon" />
                    <img src="./video.png" alt="Video" className="icon" />
                    <img src="./info.png" alt="Info" className="icon" />
                </div>
            </div>

            {/* Chat Messages */}
            <div className="center">
                <div className="message own">
                    <img src="https://cdn3.iconfinder.com/data/icons/business-avatar-1/512/11_avatar-512.png" alt="Avatar" className="avatar-small" />
                    <div className="texts">
                        <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est</p>
                    </div>
                    <span className="time">1 min ago</span>
                </div>
                <div className="message">
                    <img src="./avatar.png" alt="Avatar" className="avatar-small" />
                    <div className="texts">
                        <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper </p>
                    </div>
                    <span className="time">2 min ago</span>
                </div>
                <div className="message own">
                    <img src="./avatar.png" alt="Avatar" className="avatar-small" />
                    <div className="texts">
                        <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est</p>
                    </div>
                    <span className="time">1 min ago</span>
                </div>

                <div className="message own">
                    <img src="./avatar.png" alt="Avatar" className="avatar-small" />
                    <div className="texts">
                        <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est</p>
                    </div>
                    <span className="time">1 min ago</span>
                </div>


                <div className="message own">
                    <img src="./avatar.png" alt="Avatar" className="avatar-small" />
                    <div className="texts">
                        <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est</p>
                    </div>
                    <span className="time">1 min ago</span>
                </div>
                <div className="message">
                    <img src="https://icons.veryicon.com/png/o/miscellaneous/user-avatar/user-avatar-male-5.png" alt="Avatar" className="avatar-small" />
                    <div className="texts">
                        <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper </p>
                    </div>
                    <span className="time">2 min ago</span>
                </div>
                {/* Scroll to bottom anchor */}
                <div ref={endRef}></div>
            </div>

            {/* Bottom Input Section */}
            <div className="bottom">
                <div className="icons">
                    <img src="./mic.png" alt="Microphone" className="icon" />
                    <img src="./camera.png" alt="Camera" className="icon" />
                </div>
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="input"
                    value={text}
                    onChange={handleInputChange}
                />
                <div className="emoji">
                    <img
                        src="./emoji.png"
                        alt="Emoji Picker"
                        onClick={() => setOpen((prev) => !prev)}
                        className="icon"
                    />
                    {open && (
                        <div className="emoji-picker-container">
                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </div>
                    )}
                </div>
                    <button className="sendButton">Send</button>
            </div>
        </div>
    );
};

export default Chat;
