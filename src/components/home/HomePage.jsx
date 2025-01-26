// src/components/HomePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../register/Register';
import Login from '../login/Login';
import "../home/home.css";

const HomePage = () => {
  const [view, setView] = useState('home');
  const navigate = useNavigate();  // New hook for programmatically navigating

  const handleLogin = () => {
    setView('login');
  };

  const onLoggedIn = () => {
    navigate('/dashboard');  // Redirect to dashboard after login
  };

  return (
    <div className="home-container">
      {view === 'home' && (
        <div>
          <button onClick={() => setView('register')}>Register</button>
          <button onClick={handleLogin}>Login</button>
        </div>
      )}
      {view === 'register' && <Register />}
      {view === 'login' && <Login onLoggedIn={onLoggedIn} />}
    </div>
  );
}

export default HomePage;
