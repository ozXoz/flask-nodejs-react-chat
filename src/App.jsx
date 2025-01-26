// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/home/HomePage';
import PublicDisplay from './components/publicDisplay/PublicDisplay';

const App = () => {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} index />
          <Route path="/dashboard" element={<PublicDisplay />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
