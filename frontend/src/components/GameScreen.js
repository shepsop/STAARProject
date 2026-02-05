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

      if (result?.level_up) {
        setLeveledUp(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } else {
      await updateProgress({
        correct: false,
        points: 0,
        subject: subject,
        level: parseInt(level)
      });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setGameFinished(true);
      if (correctCount >= questions.length * 0.7) {
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

  return (
    <motion.div 
      className="game-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
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
            </div>
            <div className="question-points">
              {currentQuestion.points || 10} Points
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
                {currentQuestion.explanation}
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
