import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/home/HomePage';
import PublicDisplay from './components/publicDisplay/PublicDisplay';
import Login from './components/login/Login';

const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  return !!token;
};

const App = () => {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} index />
          <Route
            path="/dashboard"
            element={isAuthenticated() ? <PublicDisplay /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
