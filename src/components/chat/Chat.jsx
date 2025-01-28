import React, { useState, useEffect, useRef } from "react";
import socket from "../utils/socket";
import "./chat.css";

const Chat = ({ recipient, onSelectRecipient }) => {
  const [messages, setMessages] = useState([]); // Entire chat history
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]); // Chat list with last message
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // To auto-scroll
  const email = localStorage.getItem("email");
  const nickname = localStorage.getItem("nickname");

  const chatId = recipient && [nickname, recipient.participant].sort().join("_");

  // Fetch all conversations (ChatList)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/chat/conversations?email=${email}`);
        if (response.ok) {
          const data = await response.json();
          console.log("[DEBUG] Fetched conversations:", data);
          setConversations(data);
        } else {
          console.error("[ERROR] Failed to fetch conversations:", response.statusText);
        }
      } catch (err) {
        console.error("[ERROR] Error fetching conversations:", err);
      }
    };
  
    fetchConversations();
  }, [email]);
  

  // Fetch all messages for the selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (chatId) {
        try {
          console.log("[DEBUG] Fetching messages for chatId:", chatId);
    
          const response = await fetch(
            `http://127.0.0.1:5000/auth/chat/messages/${chatId}`
          );
    
          if (response.ok) {
            const data = await response.json();
            console.log("[DEBUG] Messages fetched:", data);
    
            setMessages(data);
          } else {
            console.error("[ERROR] Failed to fetch messages:", response.statusText);
          }
        } catch (err) {
          console.error("[ERROR] Error fetching messages:", err);
        }
      } else {
        console.warn("[DEBUG] No chatId provided.");
      }
    };
    
    
  
    fetchMessages();
  }, [chatId]);
  
  

  // Listen for real-time updates
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      if (data.chatId === chatId) {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [chatId]);

  // Send a new message
  const sendMessage = () => {
    if (message.trim() && recipient) {
      const msgData = {
        chatId,
        sender: nickname,
        email,
        recipient: recipient.participant,
        message,
        timestamp: new Date().toISOString(),
      };

      socket.emit("sendMessage", msgData);
      setMessages((prevMessages) => [...prevMessages, msgData]);
      setMessage("");
    } else {
      console.error("Message or recipient is missing.");
    }
  };

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-main">
      {recipient ? (
        <>
          <div className="chat-header">
            <h4>Chat with {recipient.participant}</h4>
          </div>
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
              <p>No messages yet. Start the conversation!</p>
            )}
            <div ref={messagesEndRef}></div>
          </div>
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
        <div className="no-selection">
          <h3>Conversations</h3>
          {loading ? (
            <p>Loading...</p>
          ) : conversations.length > 0 ? (
            conversations.map((conv, index) => (
              <div
                key={index}
                className="conversation-item"
                onClick={() => onSelectRecipient(conv)}
              >
                <img
                  src="./avatar.png"
                  alt="Avatar"
                  className="conversation-avatar"
                />
                <div className="conversation-info">
                  <span className="conversation-name">{conv.participant}</span>
                  <span className="conversation-preview">{conv.lastMessage}</span>
                </div>
              </div>
            ))
          ) : (
            <p>No conversations found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
