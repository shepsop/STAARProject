import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import GameScreen from './components/GameScreen';
import Dashboard from './components/Dashboard';
import LevelSelect from './components/LevelSelect';
import Login from './components/Login';
import Register from './components/Register';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [token, setToken] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for token on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('user_id');
    const storedUsername = localStorage.getItem('username');

    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(storedUserId);
      setUsername(storedUsername);
      fetchUserProgress(storedUserId, storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProgress = async (uid, authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/user/${uid}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.status === 401) {
        // Token expired
        handleLogout();
        return;
      }

      const data = await response.json();
      setUserProgress(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      setLoading(false);
    }
  };

  const updateProgress = async (progressData) => {
    try {
      const response = await fetch(`${API_URL}/api/user/${userId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(progressData),
      });

      if (response.status === 401) {
        handleLogout();
        return null;
      }

      const data = await response.json();
      setUserProgress(data.user);
      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    setToken(null);
    setUserId(null);
    setUsername(null);
    setUserProgress(null);
    setLoading(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          🌟
        </motion.div>
        <h2>Loading Your Adventure...</h2>
      </div>
    );
  }

  // Not authenticated - show login/register
  if (!token || !userId) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Authenticated - show main app
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <Link to="/" className="logo-link">
            <motion.h1
              className="app-title"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌟 STAAR Quest 🌟
            </motion.h1>
          </Link>
          {userProgress && (
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <span className="stat-value">{userProgress.total_points}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🏆</span>
                <span className="stat-value">Level {userProgress.current_level}</span>
              </div>
              <div className="stat-item user-info">
                <span className="stat-icon">👤</span>
                <span className="stat-value">{username}</span>
              </div>
              <motion.button
                className="logout-button"
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          )}
        </header>

        <Routes>
          <Route path="/" element={<Dashboard userProgress={userProgress} />} />
          <Route path="/select/:subject" element={<LevelSelect userProgress={userProgress} />} />
          <Route 
            path="/play/:subject/:level" 
            element={
              <GameScreen 
                userId={userId} 
                userProgress={userProgress}
                updateProgress={updateProgress}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
