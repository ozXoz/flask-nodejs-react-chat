// src/components/login/Login.jsx
import React from 'react';
import './login.css';

const Login = ({ onLoggedIn }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onLoggedIn();  // Call the callback function passed from the parent component
  };

  return (
    <form className="login" onSubmit={handleSubmit}>
      <label htmlFor="email">Email:</label>
      <input id="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
