import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

const API_URL = process.env.REACT_APP_API_URL || '';

function GameScreen({ userId, userProgress, updateProgress }) {
  const { subject, level } = useParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [streakBonus, setStreakBonus] = useState(0);
  
  // New gamification states
  const [currentCombo, setCurrentCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1.0);
  const [mysteryBox, setMysteryBox] = useState(null);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [characterMood, setCharacterMood] = useState('happy'); // happy, excited, encouraging
  const [completedChallenges, setCompletedChallenges] = useState([]);

  // Sound effects
  const playSound = (soundType) => {
    const sounds = {
      correct: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzffei0QHGH7A7OScTw4RVKzn7rVjGgU7k9v0yX0vBSZ+zPLaizsIGGe57OihUxELTqXh8L1qJAU3id31zpBAChdb8/LHby0FKH3J8duKPwgZb77r6RQMBR='),
      wrong: new Audio('data:audio/wav;base64,UklGRnQIAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAIAACAgICAfoB9gHuAeYB3gHWAc4BxgG+AboBsgGqAaIBlgGOAYYBegFyAWYBXgFWAU4BQgE6ATIBJgEeARYBCgECAPoA7gDmANwA1gDKAMIAugCyAKYAngCWAI4AggB6AHIAZFw=='),
      levelup: new Audio('data:audio/wav;base64,UklGRkoIAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSYIAACAgIGCgISChYKGgoeEiIOJgomDioKLgoyBjYCOfY99jn2PfZB8kXuSeZN4lHiVd5Z2l3WYdJlzmnKbcZxvnW6ebaZsq2itra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNr667sbJ0='),
      combo: new Audio('data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAB/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gH+Af4B/gA=='),
      mysteryBox: new Audio('data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAEAAB/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f38=')
    };
    
    try {
      // Create a simple beep sound using Web Audio API for better compatibility
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (soundType === 'correct') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (soundType === 'wrong') {
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } else if (soundType === 'combo') {
        oscillator.frequency.value = 1200;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else if (soundType === 'mysteryBox') {
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (e) {
      // Silently fail if audio is not supported
      console.log('Audio not supported');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [subject, level]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/questions/${subject}?level=${level}&count=5`);
      const data = await response.json();
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (!showExplanation) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    setShowExplanation(true);

    if (isCorrect) {
      playSound('correct');
      setCharacterMood('excited');
      
      const points = currentQuestion.points || 10;
      setScore(score + points);
      setCorrectCount(correctCount + 1);
      
      // Update progress in backend
      const result = await updateProgress({
        correct: true,
        points: points,
        subject: subject,
        level: parseInt(level)
      });

      // Handle combo
      if (result?.combo) {
        setCurrentCombo(result.combo);
        if (result.combo >= 2) {
          setShowCombo(true);
          setComboMultiplier(result.combo_multiplier || 1.0);
          playSound('combo');
          setTimeout(() => setShowCombo(false), 2000);
        }
      }

      if (result?.level_up) {
        setLeveledUp(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      if (result?.streak_bonus) {
        setStreakBonus(result.streak_bonus);
      }

      if (result?.new_badges && result.new_badges.length > 0) {
        setNewBadges(prev => [...prev, ...result.new_badges]);
      }
      
      if (result?.completed_challenges && result.completed_challenges.length > 0) {
        setCompletedChallenges(prev => [...prev, ...result.completed_challenges]);
      }
    } else {
      playSound('wrong');
      setCharacterMood('encouraging');
      setCurrentCombo(0);
      
      await updateProgress({
        correct: false,
        points: 0,
        subject: subject,
        level: parseInt(level)
      });
    }
    
    // Reset character mood after a moment
    setTimeout(() => setCharacterMood('happy'), 2000);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Game finished - check for perfect game
      const isPerfectGame = correctCount === questions.length;
      
      // Send game completion update
      const result = await updateProgress({
        correct: false,
        points: 0,
        subject: subject,
        level: parseInt(level),
        game_completed: true,
        perfect_game: isPerfectGame,
        correct_count: correctCount,
        total_questions: questions.length
      });

      if (result?.new_badges && result.new_badges.length > 0) {
        setNewBadges(result.new_badges);
      }
      
      if (result?.mystery_box) {
        setMysteryBox(result.mystery_box);
        setShowMysteryBox(true);
        playSound('mysteryBox');
        setTimeout(() => setShowMysteryBox(false), 5000);
      }
      
      if (result?.completed_challenges && result.completed_challenges.length > 0) {
        setCompletedChallenges(prev => [...prev, ...result.completed_challenges]);
      }
      
      setGameFinished(true);
      if (correctCount >= questions.length * 0.7 || isPerfectGame) {
        setShowConfetti(true);
      }
    }
  };

  const getStars = () => {
    const percentage = (correctCount / questions.length) * 100;
    if (percentage >= 90) return '⭐⭐⭐';
    if (percentage >= 70) return '⭐⭐';
    if (percentage >= 50) return '⭐';
    return '😊';
  };

  const getEncouragingMessage = () => {
    const percentage = (correctCount / questions.length) * 100;
    if (percentage >= 90) return "Outstanding! You're a STAAR superstar! 🌟";
    if (percentage >= 70) return "Great job! You're doing amazing! 🎉";
    if (percentage >= 50) return "Good effort! Keep practicing! 💪";
    return "Nice try! Practice makes perfect! 🌱";
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
        <h2>Loading Questions...</h2>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="game-screen">
        <div className="question-card">
          <h2>No questions available for this level yet!</h2>
          <button className="play-button" onClick={() => navigate('/')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    return (
      <motion.div 
        className="game-screen"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {showConfetti && <Confetti />}
        <div className="results-screen">
          <motion.h2
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {getEncouragingMessage()}
          </motion.h2>
          
          {leveledUp && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
              style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '15px',
                margin: '1rem 0',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}
            >
              🎊 LEVEL UP! You're now Level {userProgress.current_level}! 🎊
            </motion.div>
          )}

          {/* New Badges Earned */}
          {newBadges.length > 0 && (
            <motion.div
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', delay: 0.5 }}
              style={{ margin: '1rem 0' }}
            >
              <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>🎉 New Badges Earned!</h3>
              <div className="badges-earned">
                {newBadges.map((badge, idx) => (
                  <motion.div
                    key={idx}
                    className="badge-notification"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1, type: 'spring' }}
                  >
                    <div className="badge-icon-large">{badge.icon}</div>
                    <div className="badge-info">
                      <div className="badge-name-large">{badge.name}</div>
                      <div className="badge-desc">{badge.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Streak Bonus */}
          {streakBonus > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.4 }}
              style={{
                background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
                color: 'white',
                padding: '1rem',
                borderRadius: '15px',
                margin: '1rem 0',
                fontSize: '1.2rem'
              }}
            >
              🔥 Streak Bonus: +{streakBonus} points!
            </motion.div>
          )}

          <div className="stars-display">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              {getStars()}
            </motion.span>
          </div>

          <div className="score-display">
            {correctCount} / {questions.length}
          </div>

          <div className="results-stats">
            <div className="stat-box">
              <h3>Points Earned</h3>
              <p>{score}</p>
            </div>
            <div className="stat-box">
              <h3>Accuracy</h3>
              <p>{Math.round((correctCount / questions.length) * 100)}%</p>
            </div>
            <div className="stat-box">
              <h3>Total Points</h3>
              <p>{userProgress.total_points}</p>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="play-button" 
              onClick={() => {
                setGameFinished(false);
                setCurrentQuestionIndex(0);
                setScore(0);
                setCorrectCount(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
                fetchQuestions();
              }}
            >
              Play Again
            </button>
            <button 
              className="play-button" 
              onClick={() => navigate(`/select/${subject}`)}
              style={{ background: '#4caf50' }}
            >
              Choose Level
            </button>
            <button 
              className="play-button" 
              onClick={() => navigate('/')}
              style={{ background: '#999' }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;
  
  // Character expressions
  const characterExpressions = {
    happy: '😊',
    excited: '🎉',
    encouraging: '💪'
  };

  return (
    <motion.div 
      className="game-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating Character Mascot */}
      <motion.div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          fontSize: '4rem',
          zIndex: 1000
        }}
        animate={{
          y: [0, -10, 0],
          rotate: characterMood === 'excited' ? [0, 10, -10, 0] : 0
        }}
        transition={{
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 0.5 }
        }}
      >
        {characterExpressions[characterMood]}
      </motion.div>

      {/* Combo Display */}
      <AnimatePresence>
        {showCombo && currentCombo >= 2 && (
          <motion.div
            initial={{ scale: 0, y: -50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              top: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '1.5rem 2rem',
              borderRadius: '20px',
              fontSize: '2rem',
              fontWeight: 'bold',
              zIndex: 1000,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔥</div>
            <div>{currentCombo}x COMBO!</div>
            <div style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>
              {comboMultiplier}x Points!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mystery Box Popup */}
      <AnimatePresence>
        {showMysteryBox && mysteryBox && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
              color: '#333',
              padding: '2rem',
              borderRadius: '20px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              zIndex: 1001,
              boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
              textAlign: 'center',
              minWidth: '300px'
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              🎁 {mysteryBox.icon}
            </div>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              Mystery Box!
            </div>
            <div style={{ fontSize: '1.3rem', color: '#555' }}>
              {mysteryBox.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Challenges Notification */}
      <AnimatePresence>
        {completedChallenges.map((challenge, idx) => (
          <motion.div
            key={`challenge-${idx}`}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            style={{
              position: 'fixed',
              top: `${150 + idx * 100}px`,
              right: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '15px',
              fontSize: '1rem',
              zIndex: 999,
              boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
              maxWidth: '300px'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{challenge.icon}</div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.3rem' }}>
              Challenge Complete!
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              {challenge.title}
            </div>
            <div style={{ fontSize: '1.2rem', marginTop: '0.5rem', color: '#ffd700' }}>
              +{challenge.reward} points!
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          className="question-card"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <div className="question-header">
            <div className="question-number">
              Question {currentQuestionIndex + 1} of {questions.length}
              {currentCombo > 0 && (
                <span style={{ 
                  marginLeft: '1rem', 
                  color: '#f5576c', 
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  🔥 {currentCombo}x Combo
                </span>
              )}
            </div>
            <div className="question-points">
              {currentQuestion.points || 10} Points
              {comboMultiplier > 1 && (
                <span style={{ color: '#f5576c', marginLeft: '0.5rem' }}>
                  ({comboMultiplier}x)
                </span>
              )}
            </div>
          </div>

          {currentQuestion.passage && (
            <div className="passage">
              {currentQuestion.passage}
            </div>
          )}

          <div className="question-text">
            {currentQuestion.question}
          </div>

          <div className="options-grid">
            {currentQuestion.options.map((option, index) => {
              let className = 'option-button';
              if (showExplanation) {
                if (index === currentQuestion.correct_answer) {
                  className += ' correct';
                } else if (index === selectedAnswer) {
                  className += ' incorrect';
                }
              } else if (index === selectedAnswer) {
                className += ' selected';
              }

              return (
                <motion.button
                  key={index}
                  className={className}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  whileHover={!showExplanation ? { scale: 1.02 } : {}}
                  whileTap={!showExplanation ? { scale: 0.98 } : {}}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </motion.button>
              );
            })}
          </div>

          {!showExplanation ? (
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
            >
              Submit Answer
            </button>
          ) : (
            <>
              <motion.div 
                className="explanation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <strong>{isCorrect ? '✅ Correct!' : '❌ Not quite!'}</strong>
                <br />
                {isCorrect 
                  ? currentQuestion.explanation
                  : currentQuestion.explanation
                      .replace(/^(Perfect|Great|Excellent|Amazing|Wonderful|Super|Fantastic|Awesome|Outstanding|Brilliant|Nice work|Good job)!\s*/i, 'The correct answer is: ')
                }
              </motion.div>
              <button className="next-button" onClick={handleNext}>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'See Results! 🎉'}
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default GameScreen;
