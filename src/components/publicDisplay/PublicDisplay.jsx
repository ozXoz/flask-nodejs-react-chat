// src/components/publicDisplay/PublicDisplay.jsx
import React from 'react';
import List from '../list/List';
import Chat from '../chat/Chat';
import Detail from '../detail/Detail';
import './publicDisplay.css';  // Make sure your styles are linked


const PublicDisplay = () => {
  return (
    <div className="public-display">
      <List />
      <Chat />
      <Detail />
    </div>
  );
}

export default PublicDisplay;
