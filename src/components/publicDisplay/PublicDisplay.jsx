import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import List from '../list/List';
import Chat from '../chat/Chat';
import Detail from '../detail/Detail';
import './publicDisplay.css';

const PublicDisplay = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('Unauthorized access. Redirecting to login...');
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="public-display">
      <List />
      <Chat />
      <Detail />
    </div>
  );
};

export default PublicDisplay;
