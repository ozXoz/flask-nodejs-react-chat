// src/components/register/Register.jsx
import React from 'react';
import './register.css';

const Register = ({ onRegistered }) => {
  return (
    <form className="register" onSubmit={(e) => { e.preventDefault(); onRegistered(); }}>
      <label htmlFor="email">Email:</label>
      <input id="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" type="password" required />
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
