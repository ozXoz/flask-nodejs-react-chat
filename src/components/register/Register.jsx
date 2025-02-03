import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';
import CONFIG from '../utils/config';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${CONFIG.FLASK_BACKEND}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          re_password: password, // Confirm password
          nickname,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        setSuccess(data.message);
        setError('');
        setTimeout(() => navigate('/login'), 2000); // Redirect to login after 2 seconds
      } else {
        // Registration failed
        setError(data.error || 'An error occurred');
        setSuccess('');
      }
    } catch (err) {
      setError('Unable to connect to the server');
      setSuccess('');
    }
  };

  return (
    <form className="register" onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label htmlFor="nickname">Nickname:</label>
      <input
        id="nickname"
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        required
      />
      <label htmlFor="password">Password:</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
