import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import GameScreen from './components/GameScreen';
import Dashboard from './components/Dashboard';
import LevelSelect from './components/LevelSelect';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [userId] = useState('student1'); // In production, this would come from auth
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProgress();
  }, []);

  const fetchUserProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/${userId}`);
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
        },
        body: JSON.stringify(progressData),
      });
      const data = await response.json();
      setUserProgress(data.user);
      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      return null;
    }
  };

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
