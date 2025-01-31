import React, { useState, useEffect, useRef } from "react";
import socket from "../utils/socket";
import EmojiPicker from "emoji-picker-react";
import "./chat.css";
import VideoCall from "../call/VideoCall"; // Adjust path to your new VideoCall.jsx

const Chat = ({ recipient, setSharedFiles, blockedUsers = [] }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

    // << VIDEO CALL CHANGES >>
    const [showVideoCall, setShowVideoCall] = useState(false);

  const myEmail = localStorage.getItem("email");
  const theme = localStorage.getItem("chatTheme") || "light";

  const chatId =
    recipient && recipient.participant
      ? [myEmail, recipient.participant].sort().join("_")
      : null;

  // Fetch old messages from Flask
  useEffect(() => {
    if (!chatId) return;
    const fetchMessages = async () => {
      try {
        // <<<<< ADDED: mode: "cors" >>>>>
        const response = await fetch(
          `http://127.0.0.1:5000/auth/chat/messages/${chatId}`,
          { mode: "cors" }
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          const files = data
            .filter((msg) => msg.file)
            .map((msg) => ({
              name: msg.file.name,
              url: msg.file.url,
              type: msg.file.type,
            }));
          setSharedFiles(files);
        } else {
          console.error("Failed to fetch messages");
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [chatId, setSharedFiles]);

  // Listen for new messages via Socket
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data]);
        if (data.file) {
          setSharedFiles((prevFiles) => [
            ...prevFiles,
            {
              name: data.file.name,
              url: data.file.url,
              type: data.file.type,
            },
          ]);
        }
      }
    };
    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [chatId, setSharedFiles]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // <<<<< ADDED: mode: "cors" >>>>>
      const response = await fetch("http://127.0.0.1:4000/file/upload", {
        method: "POST",
        body: formData,
        mode: "cors", // <<<<< ADDED
      });
      if (response.ok) {
        const { file } = await response.json();
        setFile({
          name: file.name,
          url: file.url,
          type: file.type,
        });
      } else {
        console.error("Failed to upload file");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

 /////////////////////////////
// Chat.jsx snippet
/////////////////////////////

const sendMessage = async () => {
  if (!recipient || !recipient.participant) return;
  if (blockedUsers.includes(recipient.participant)) {
    alert("You cannot send messages to a user you have blocked.");
    return;
  }

  if (message.trim() || file) {
    const msgData = {
      chatId,
      sender: myEmail,
      recipient: recipient.participant,
      message: message.trim(),
      file: file || null,
      timestamp: new Date().toISOString(),
    };

    // 1) Attempt to persist with Node:
    try {
      const res = await fetch(`http://127.0.0.1:4000/chat/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgData),
        mode: "cors",
      });

      if (!res.ok) {
        // If server says 403, parse the error & show a message
        if (res.status === 403) {
          const { error } = await res.json();
          alert(error || "You are blocked!");
        } else {
          console.error("Server error:", res.status);
        }
        // IMPORTANT: return early, do NOT add to local state or emit socket
        return;
      }

      // 2) If success, get the actual saved data from the server
      const savedMessage = await res.json();

      // 3) Now we can add to local state
      setMessages((prev) => [...prev, savedMessage]);

      // 4) Emit via socket for real-time
      socket.emit("sendMessage", savedMessage);

      // Clear input
      setMessage("");
      setFile(null);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  }
};


  return (
    <div className={`chat-main ${theme}`}>
      {recipient && recipient.participant ? (
        <>
          <div className="chat-header">
            <h4>Chat with {recipient.participant}</h4>
            {/* << VIDEO CALL CHANGES >> */}
            <button
              onClick={() => setShowVideoCall(true)}
              style={{ marginLeft: "auto" }}
            >
              Call
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender === myEmail ? "own" : ""}`}
              >
                {msg.message && <p>{msg.message}</p>}

                {msg.file && msg.file.type.startsWith("image") ? (
                  // crossOrigin optional to avoid OpaqueResponseBlocking
                  <img
                    src={msg.file.url}
                    alt="Sent file"
                    className="chat-image"
                    crossOrigin="anonymous"
                  />
                ) : msg.file && msg.file.type === "pdf" ? (
                  <embed
                    src={msg.file.url}
                    width="250px"
                    height="200px"
                    type="application/pdf"
                  />
                ) : msg.file ? (
                  <a href={msg.file.url} target="_blank" rel="noopener noreferrer">
                    📄 {msg.file.name}
                  </a>
                ) : null}

                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="chat-input">
            <div className="emoji-container">
              <button
                className="emoji-button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
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
          {/* << VIDEO CALL CHANGES >> */}
          {showVideoCall && (
            <VideoCall
              currentUser={myEmail}
              targetUser={recipient.participant}
              onCloseCall={() => setShowVideoCall(false)}
            />
          )}
        </>
      ) : (
        <p className="no-selection">Select a conversation to start chatting</p>
      )}
    </div>
  );
};

export default Chat;
