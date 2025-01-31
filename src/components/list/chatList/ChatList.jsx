import React, { useState, useEffect } from "react";
import socket from "../../utils/socket";
import "./chatList.css";

const ChatList = ({ onSelectRecipient }) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);

  // Map of email -> avatarUrl
  const [avatarMap, setAvatarMap] = useState({});

  // Current user's own avatar (if we want to show in ChatList)
  const email = localStorage.getItem("email") || "";
  const [avatar, setAvatar] = useState(
    () => localStorage.getItem("avatar") || "./avatar.png"
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const newAvatar = localStorage.getItem("avatar") || "./avatar.png";
      setAvatar(newAvatar);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Fetch conversation list on mount
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/auth/conversations?email=${email}`,
          { mode: "cors" }
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
    if (email) fetchConversations();
  }, [email]);

  // Listen for new conversation
  useEffect(() => {
    const handleNewConversation = (data) => {
      setConversations((prev) => {
        const exists = prev.some((conv) => conv.chatId === data.chatId);
        return exists ? prev : [data, ...prev];
      });
    };
    socket.on("newConversation", handleNewConversation);
    return () => {
      socket.off("newConversation", handleNewConversation);
    };
  }, []);

  // Listen for conversation updates
  useEffect(() => {
    socket.on("updateConversation", (data) => {
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.chatId === data.chatId
            ? { ...conv, lastMessage: data.lastMessage, timestamp: data.timestamp }
            : conv
        );
        if (!updated.some((conv) => conv.chatId === data.chatId)) {
          updated.unshift(data);
        }
        return updated;
      });
    });
    return () => {
      socket.off("updateConversation");
    };
  }, []);

  // Handle searching for users
  const handleSearch = async () => {
    if (!search.trim()) {
      setShowSearchResults(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/auth/users?q=${search}`,
        { mode: "cors" }
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setShowSearchResults(true);
      } else {
        console.error("Failed to search users:", response.statusText);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

// ChatList.jsx (fixed: remove 'avatarMap' from the effect dependencies)

useEffect(() => {
  // Suppose we already fetched "conversations"
  // which is an array of { participant: "bmw@bmw.ca", lastMessage: "...", ... }

  const fetchAvatars = async () => {
    // We clone the old map so we can add new participants' avatars.
    // If we never re-add 'avatarMap' to the deps, we won't infinitely loop.
    const newMap = { ...avatarMap };

    for (let conv of conversations) {
      const participantEmail = conv.participant;

      if (!newMap[participantEmail]) {
        try {
          const resp = await fetch(
            `http://127.0.0.1:5000/auth/user?email=${participantEmail}`,
            { mode: "cors" }
          );
          if (resp.ok) {
            const data = await resp.json();
            newMap[participantEmail] = data.avatarUrl || "./avatar.png";
          } else {
            newMap[participantEmail] = "./avatar.png";
          }
        } catch (err) {
          console.error("Error fetching avatar for:", participantEmail, err);
          newMap[participantEmail] = "./avatar.png";
        }
      }
    }

    // This updates the state once, after we fetch.
    setAvatarMap(newMap);
  };

  if (conversations.length > 0) {
    fetchAvatars();
  }
  // <<<<< KEY CHANGE: removed 'avatarMap' from the dependency array >>>>>
}, [conversations]); 


return (
  <div className="chatList">
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
    {loading && <p className="loading">Loading...</p>}

    {showSearchResults ? (
      // <<<<< FIXED: map over `users`, NOT `conversations` >>>>>
      <div className="userList">
        {users.length > 0 ? (
          users.map((user, index) => {
            // If you want an avatar for each searched user,
            // either fetch user.avatarUrl or show default.
            const participantEmail = user.email;
            const participantAvatar = avatarMap[participantEmail] || "./avatar.png";

            return (
              <div
                key={index}
                className="item"
                onClick={() =>
                  onSelectRecipient({
                    participant: user.email,
                    nickname: user.nickname,
                  })
                }
              >
                <img
                  src={participantAvatar}
                  alt="Avatar"
                  className="chat-avatar"
                  crossOrigin="anonymous"
                />
                <div className="texts">
                  <span>{user.nickname}</span>
                  <p>{user.email}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p>No users found.</p>
        )}
      </div>
    ) : (
      // Default conversation list
      <div className="conversations">
        {conversations.length > 0 ? (
          conversations.map((conv, index) => {
            const participantEmail = conv.participant;
            const participantAvatar = avatarMap[participantEmail] || "./avatar.png";
            return (
              <div
                key={index}
                className="item"
                onClick={() => onSelectRecipient(conv)}
              >
                <img
                  src={participantAvatar}
                  alt="Avatar"
                  className="chat-avatar"
                  crossOrigin="anonymous"
                />
                <div className="texts">
                  <span>{conv.participant}</span>
                  <p>{conv.lastMessage}</p>
                  <span className="timestamp">
                    {new Date(conv.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p>No conversations found.</p>
        )}
      </div>
    )}
  </div>
);

};

export default ChatList;
