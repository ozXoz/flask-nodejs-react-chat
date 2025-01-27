import React, { useState, useEffect, useRef } from "react"; // Ensure useRef is included
import socket from "../utils/socket";
import "./chat.css";

const Chat = ({ recipient }) => {
  const [messages, setMessages] = useState([]); // Messages in the selected conversation
  const [message, setMessage] = useState(""); // Input message
  const messagesEndRef = useRef(null); // Ref for auto-scroll
  const email = localStorage.getItem("email"); // Logged-in user's email
  const nickname = localStorage.getItem("nickname"); // Sender's nickname

  // Generate a consistent `chatId`
  const chatId =
    recipient && [nickname, recipient.participant].sort().join("_");

  // Fetch previous messages when a recipient is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (recipient) {
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/auth/messages?email=${email}&recipient=${recipient.participant}`
          );
          if (response.ok) {
            const data = await response.json();
            setMessages(data); // Update state with previous messages
          } else {
            console.error("Failed to fetch messages:", response.statusText);
          }
        } catch (err) {
          console.error("Error fetching messages:", err);
        }
      }
    };

    fetchMessages();
  }, [recipient, email]);

  // Listen for real-time messages via Socket.IO
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      if (data.chatId === chatId) {
        setMessages((prevMessages) => [...prevMessages, data]); // Add new message to the chat
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage); // Cleanup listener
    };
  }, [chatId]);

  // Send a new message
  const sendMessage = () => {
    if (message.trim() && recipient) {
      const msgData = {
        chatId,
        sender: nickname,
        email, // Sender's email
        recipient: recipient.participant,
        message,
        timestamp: new Date().toISOString(),
      };

      // Emit the message using Socket.IO
      socket.emit("sendMessage", msgData);

      // Optimistically update the local messages state
      setMessages((prevMessages) => [...prevMessages, msgData]);

      // Clear the input field
      setMessage("");
    } else {
      console.error("Missing fields:", { message, recipient });
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-main">
      {recipient ? (
        <>
          {/* Chat Header */}
          <div className="chat-header">
            <h4>Chat with {recipient.participant}</h4>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender === nickname ? "own" : ""}`}
                >
                  <p>{msg.message}</p>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            ) : (
              <p>No messages yet</p>
            )}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Chat Input */}
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage} disabled={!message.trim()}>
              Send
            </button>
          </div>
        </>
      ) : (
        <div className="no-selection">Select a conversation to start chatting</div>
      )}
    </div>
  );
};

export default Chat;
