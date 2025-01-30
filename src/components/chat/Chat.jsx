import React, { useState, useEffect, useRef } from "react";
import socket from "../utils/socket";
import EmojiPicker from "emoji-picker-react";
import "./chat.css";

const Chat = ({ recipient, setSharedFiles, blockedUsers = [] }) => { // ✅ Set default empty array
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const email = localStorage.getItem("email");
  const nickname = localStorage.getItem("nickname");
  const [theme, setTheme] = useState(localStorage.getItem("chatTheme") || "light");

  const chatId = recipient && [nickname, recipient.participant].sort().join("_");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (chatId) {
        try {
          const response = await fetch(`http://127.0.0.1:5000/auth/chat/messages/${chatId}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);

            const sharedFiles = data
              .filter(msg => msg.file)
              .map(msg => ({ name: msg.file.name, url: msg.file.url, type: msg.file.type }));

            setSharedFiles(sharedFiles);
          } else {
            console.error("Failed to fetch messages");
          }
        } catch (err) {
          console.error("Error fetching messages:", err);
        }
      }
    };
    fetchMessages();
  }, [chatId, setSharedFiles]);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data]);

        if (data.file) {
          setSharedFiles((prevFiles) => [...prevFiles, data.file]);
        }
      }
    };
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [chatId, setSharedFiles]);

  const sendMessage = () => {
    if (blockedUsers.includes(recipient.participant)) { // ✅ Check blocked users before sending
      alert("You have blocked this user. Unblock them to send messages.");
      return;
    }

    if (message.trim() || file) {
      const msgData = {
        chatId,
        sender: nickname,
        email: email,
        recipient: recipient.participant,
        message: message.trim() || " ",
        file: file ? { name: file.name, url: file.url, type: file.type } : null,
        timestamp: new Date().toISOString(),
      };

      socket.emit("sendMessage", msgData);
      setMessages((prev) => [...prev, msgData]);
      setMessage("");
      setFile(null);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const response = await fetch("http://127.0.0.1:4000/file/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const { file } = await response.json();
          setFile({ name: file.name, url: file.url, type: file.type });
        } else {
          console.error("Failed to upload file");
        }
      } catch (err) {
        console.error("Error uploading file:", err);
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={`chat-main ${theme}`}>
      {recipient ? (
        <>
          <div className="chat-header">
            <h4>Chat with {recipient.participant}</h4>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender === nickname ? "own" : ""}`}>
                {msg.message && <p>{msg.message}</p>}

                {msg.file && msg.file.type.startsWith("image") ? (
                  <img src={msg.file.url} alt="Sent file" className="chat-image" />
                ) : msg.file && msg.file.type === "application/pdf" ? (
                  <embed src={msg.file.url} width="250px" height="200px" type="application/pdf" />
                ) : msg.file ? (
                  <a href={msg.file.url} target="_blank" rel="noopener noreferrer">
                    📄 {msg.file.name}
                  </a>
                ) : null}

                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="chat-input">
            <div className="emoji-container">
              <button className="emoji-button" onClick={() => setShowEmojiPicker((prev) => !prev)}>
                😊
              </button>
              {showEmojiPicker && <EmojiPicker onEmojiClick={onEmojiClick} />}
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <input type="file" onChange={handleFileUpload} />
            <button onClick={sendMessage} disabled={!message.trim() && !file}>
              Send
            </button>
          </div>
        </>
      ) : (
        <p>Select a conversation to start chatting</p>
      )}
    </div>
  );
};

export default Chat;
