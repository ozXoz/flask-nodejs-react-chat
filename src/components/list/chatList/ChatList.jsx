import React, { useState, useEffect } from "react";
import socket from "../../utils/socket"; // Import the socket instance
import './chatList.css';

const ChatList = ({ onSelectRecipient }) => {
  const [search, setSearch] = useState(""); // State for search input
  const [users, setUsers] = useState([]); // State for search results
  const [conversations, setConversations] = useState([]); // State for conversations
  const [showSearchResults, setShowSearchResults] = useState(false); // Toggle between conversations and search results
  const [loading, setLoading] = useState(false); // Loading state
  const email = localStorage.getItem("email"); // Get logged-in user's email
  
  const [avatar, setAvatar] = useState(() => localStorage.getItem("avatar") || "./avatar.png");


  // Listen for avatar changes in localStorage and update state
  useEffect(() => {
    const handleStorageChange = () => {
      const newAvatar = localStorage.getItem("avatar") || "./avatar.png";
      setAvatar(newAvatar);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Fetch conversations on component mount
  useEffect(() => {
    // Update this in the frontend ChatList.jsx
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/auth/conversations?email=${email}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched conversations:", data);
          setConversations(data);
        } else {
          console.error("Failed to fetch conversations:", response.statusText);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    


    fetchConversations();
  }, [email]);

  useEffect(() => {
    const handleNewConversation = (data) => {
      setConversations((prevConversations) => {
        const exists = prevConversations.some(
          (conv) => conv.chatId === data.chatId
        );
        if (!exists) {
          return [data, ...prevConversations];
        }
        return prevConversations;
      });
    };
  
    socket.on("newConversation", handleNewConversation);
  
    return () => {
      socket.off("newConversation", handleNewConversation);
    };
  }, []);
  
  

  // Dynamically update conversations via Socket.IO
  useEffect(() => {
    socket.on("updateConversation", (data) => {
      setConversations((prevConversations) => {
        const updated = prevConversations.map((conv) =>
          conv.chatId === data.chatId
            ? { ...conv, lastMessage: data.lastMessage, timestamp: data.timestamp }
            : conv
        );
  
        if (!updated.some((conv) => conv.chatId === data.chatId)) {
          updated.unshift(data); // Add new conversation if not present
        }
  
        return updated;
      });
    });
  
    return () => {
      socket.off("updateConversation");
    };
  }, []);
  
  

  // Handle search functionality
  const handleSearch = async () => {
    if (search.trim() === "") {
      setShowSearchResults(false); // If search is empty, revert to conversation list
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/auth/users?q=${search}`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data); // Update user list with search results
        setShowSearchResults(true); // Switch to search results
      } else {
        console.error("Failed to search users:", response.statusText);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatList">
      {/* Search Bar */}
      <div className="search">
        <input
          type="text"
          placeholder="Search by nickname or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && <p className="loading">Loading...</p>}

      {/* Display Search Results */}
      {showSearchResults ? (
        <div className="userList">
          {users.length > 0 ? (
            users.map((user, index) => (
              <div
              key={index}
              className="item"
              onClick={() => {
                setShowSearchResults(false); // Switch back to conversations
                onSelectRecipient({
                  participant: user.nickname, // Ensure participant is properly set
                  email: user.email,
                });
              }}
            >
              <img src="./avatar.png" alt="Avatar" />
              <div className="texts">
                <span>{user.nickname}</span>
                <p>{user.email}</p>
              </div>
            </div>
            ))
          ) : (
            <p>No users found.</p>
          )}
        </div>
      ) : (
        /* Display Conversation List */
        <div className="conversations">
          {conversations.length > 0 ? (
            conversations.map((conv, index) => (
              <div
                key={index}
                className="item"
                onClick={() => onSelectRecipient(conv)}
              >
                                <img src={conv.avatar || "./avatar.png"} alt="Avatar" className="chat-avatar" />
                <div className="texts">
                  <span>{conv.participant}</span>
                  <p>{conv.lastMessage}</p>
                  <span className="timestamp">
                    {new Date(conv.timestamp).toLocaleString()}
                  </span>
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

export default ChatList;