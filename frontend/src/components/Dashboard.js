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

  // Reward milestones (configurable by parent)
  const rewards = [
    { points: 100, reward: "15 min extra screen time", icon: "📱" },
    { points: 250, reward: "Special dessert", icon: "🍰" },
    { points: 500, reward: "Movie night pick", icon: "🎬" },
    { points: 750, reward: "Small toy or book", icon: "🎁" },
    { points: 1000, reward: "Fun outing", icon: "🎉" },
    { points: 1500, reward: "Big reward!", icon: "🏆" }
  ];

  // Find next reward
  const nextReward = rewards.find(r => r.points > userProgress.total_points) || rewards[rewards.length - 1];
  const progressToReward = nextReward ? ((userProgress.total_points % nextReward.points) / nextReward.points) * 100 : 100;

  // Get recent badges (last 3)
  const recentBadges = (userProgress.badges || []).slice(-6).reverse();

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
        
        {/* Streak Display */}
        {userProgress.streak_days > 0 && (
          <motion.div 
            className="streak-banner"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <div className="streak-flame">🔥</div>
            <div className="streak-info">
              <div className="streak-number">{userProgress.streak_days} Day Streak!</div>
              <div className="streak-text">Keep it going! Play every day!</div>
            </div>
          </motion.div>
        )}
        
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

        {/* Stats Grid */}
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

        {/* Reward Progress */}
        {nextReward && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                Next Reward: {nextReward.reward} {nextReward.icon}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {nextReward.points - userProgress.total_points} pts to go!
              </div>
            </div>
            <div className="progress-bar" style={{ background: '#ffe0b2' }}>
              <motion.div 
                className="progress-fill"
                style={{ background: 'linear-gradient(90deg, #ff9800 0%, #ff5722 100%)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressToReward, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Badges Section */}
        {recentBadges.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#667eea', marginBottom: '1rem', fontSize: '1.5rem' }}>
              🏆 Your Badges ({userProgress.badges.length})
            </h3>
            <div className="badges-grid">
              {recentBadges.map((badge, index) => (
                <div
                  key={index}
                  className="badge-card"
                >
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-name">{badge.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>
        Choose Your Subject
      </h2>

      <div className="subject-grid">
        <Link to="/select/math" className="subject-card">
          <div className="subject-icon">
            🔢
          </div>
          <h3>Math Adventure</h3>
          <p>Solve fun math problems and earn stars!</p>
          <button className="play-button">Start Playing</button>
        </Link>

        <Link to="/select/reading" className="subject-card">
          <div className="subject-icon">
            📖
          </div>
          <h3>Reading Quest</h3>
          <p>Explore stories and answer questions!</p>
          <button className="play-button">Start Playing</button>
        </Link>
      </div>
    </motion.div>
  );
}

export default Dashboard;
