import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Store the token, email, and nickname
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('nickname', data.nickname); // Save nickname
        localStorage.setItem('email', data.email);       // Save email
        navigate('/dashboard');
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError('Unable to connect to the server');
    }
  };
  

  return (
    <form className="login" onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
