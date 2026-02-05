import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Dashboard({ userProgress }) {
  if (!userProgress) {
    return <div>Loading...</div>;
  }

  const progressToNextLevel = ((userProgress.total_points % 100) / 100) * 100;
  const accuracy = userProgress.questions_answered > 0
    ? Math.round((userProgress.correct_answers / userProgress.questions_answered) * 100)
    : 0;

  return (
    <motion.div 
      className="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="welcome-section">
        <motion.h2
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Welcome Back, Star Student! 🌟
        </motion.h2>
        <p style={{ fontSize: '1.3rem', color: '#666', marginBottom: '1rem' }}>
          You're on Level {userProgress.current_level}! Keep going!
        </p>
        
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            Progress to Level {userProgress.current_level + 1}
          </p>
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextLevel}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {progressToNextLevel > 20 && `${Math.round(progressToNextLevel)}%`}
            </motion.div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <div style={{ background: '#f0f7ff', padding: '1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '2rem' }}>⭐</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
              {userProgress.total_points}
            </div>
            <div style={{ color: '#666' }}>Total Points</div>
          </div>
          <div style={{ background: '#fff0f0', padding: '1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '2rem' }}>✓</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f5576c' }}>
              {accuracy}%
            </div>
            <div style={{ color: '#666' }}>Accuracy</div>
          </div>
          <div style={{ background: '#f0fff4', padding: '1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '2rem' }}>📚</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50' }}>
              {userProgress.questions_answered}
            </div>
            <div style={{ color: '#666' }}>Questions Done</div>
          </div>
        </div>
      </div>

      <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>
        Choose Your Subject
      </h2>

      <div className="subject-grid">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link to="/select/math" className="subject-card">
            <motion.div
              className="subject-icon"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🔢
            </motion.div>
            <h3>Math Adventure</h3>
            <p>Solve fun math problems and earn stars!</p>
            <button className="play-button">Start Playing</button>
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link to="/select/reading" className="subject-card">
            <motion.div
              className="subject-icon"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              📖
            </motion.div>
            <h3>Reading Quest</h3>
            <p>Explore stories and answer questions!</p>
            <button className="play-button">Start Playing</button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
