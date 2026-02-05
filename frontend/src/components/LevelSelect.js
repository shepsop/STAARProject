import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

function LevelSelect({ userProgress }) {
  const { subject } = useParams();
  const maxLevel = userProgress?.current_level || 1;
  
  const levels = [
    { number: 1, name: 'Beginner', emoji: '🌱', description: 'Start your journey!' },
    { number: 2, name: 'Explorer', emoji: '🔍', description: 'Getting stronger!' },
    { number: 3, name: 'Champion', emoji: '🏆', description: 'Master level!' },
    { number: 4, name: 'Star Player', emoji: '⭐', description: 'Expert mode!' },
    { number: 5, name: 'Legend', emoji: '👑', description: 'Ultimate challenge!' },
  ];

  const subjectInfo = {
    math: { icon: '🔢', color: '#667eea', title: 'Math Adventure' },
    reading: { icon: '📖', color: '#f5576c', title: 'Reading Quest' }
  };

  const info = subjectInfo[subject] || subjectInfo.math;

  return (
    <motion.div 
      className="level-select"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {info.icon} {info.title}
      </motion.h2>
      
      <p style={{ 
        color: 'white', 
        textAlign: 'center', 
        fontSize: '1.3rem', 
        marginBottom: '2rem',
        textShadow: '1px 1px 3px rgba(0,0,0,0.3)'
      }}>
        Choose your level to begin!
      </p>

      <div className="level-grid">
        {levels.map((level, index) => {
          const isLocked = level.number > maxLevel;
          
          return (
            <motion.div
              key={level.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={!isLocked ? { scale: 1.05 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
            >
              {isLocked ? (
                <div className="level-card locked">
                  <div className="lock-icon">🔒</div>
                  <div className="level-number">{level.emoji}</div>
                  <h3>{level.name}</h3>
                  <p style={{ color: '#999', fontSize: '0.9rem' }}>
                    Reach Level {level.number} to unlock!
                  </p>
                </div>
              ) : (
                <Link 
                  to={`/play/${subject}/${level.number}`} 
                  className="level-card"
                  style={{ borderTop: `4px solid ${info.color}` }}
                >
                  <div className="level-number">{level.emoji}</div>
                  <h3>{level.name}</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {level.description}
                  </p>
                  <p style={{ 
                    color: info.color, 
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    Level {level.number}
                  </p>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/">
          <button className="play-button" style={{ background: '#999' }}>
            ← Back to Dashboard
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export default LevelSelect;
