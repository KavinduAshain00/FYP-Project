import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VSCodeIDE from '../components/VSCodeIDE';
import { achievementsAPI } from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaStar, FaFire, FaChartLine, FaChevronLeft, FaChevronRight, FaRocket, FaCrown, FaGem, FaBolt, FaHeart, FaCode } from 'react-icons/fa';
import './CustomGame.css';

const CustomGame = () => {
  const navigate = useNavigate();
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [totalEdits, setTotalEdits] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  
  const [achievements, setAchievements] = useState([]);
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [saveCount, setSaveCount] = useState(0);

  // Load achievements from backend
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const response = await achievementsAPI.getUserAchievements();
        const codingAchievements = response.data.achievements.filter(
          a => a.category === 'coding' || a.category === 'general' || a.category === 'special'
        );
        setAchievements(codingAchievements);
      } catch (error) {
        console.error('Error loading achievements:', error);
      }
    };
    loadAchievements();
  }, []);

  // Timer for session time
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 60000); // Every minute

    return () => clearInterval(timer);
  }, []);

  const handlePointsEarned = (points, reason) => {
    setTotalPoints(prev => prev + points);
    
    const activity = {
      points,
      reason,
      time: new Date().toLocaleTimeString(),
    };
    
    setRecentActivities(prev => [activity, ...prev.slice(0, 9)]);

    // Track specific actions
    if (reason === 'Run Code') {
      setTotalRuns(prev => prev + 1);
      setStreak(prev => prev + 1);
    }
    
    if (reason === 'Code Edit') {
      setTotalEdits(prev => prev + 1);
    }
    
    if (reason === 'Save Project') {
      setSaveCount(prev => prev + 1);
    }

    // Check and unlock achievements
    checkAndUnlockAchievements();
  };

  const checkAndUnlockAchievements = async () => {
    for (const achievement of achievements) {
      if (achievement.earned) continue;

      let shouldEarn = false;
      const hour = new Date().getHours();

      // Check based on requirement field
      const req = achievement.requirement;
      if (req === 'edit_1_time' && totalEdits >= 1) shouldEarn = true;
      else if (req === 'edit_10_times' && totalEdits >= 10) shouldEarn = true;
      else if (req === 'edit_50_times' && totalEdits >= 50) shouldEarn = true;
      else if (req === 'streak_5' && streak >= 5) shouldEarn = true;
      else if (req === 'session_10_min' && sessionTime >= 10) shouldEarn = true;
      else if (req === 'session_30_min' && sessionTime >= 30) shouldEarn = true;
      else if (req === 'run_10_times' && totalRuns >= 10) shouldEarn = true;
      else if (req === 'code_night' && hour >= 0 && hour < 6 && totalEdits > 0) shouldEarn = true;
      else if (req === 'points_100' && totalPoints >= 100) shouldEarn = true;
      else if (req === 'points_250' && totalPoints >= 250) shouldEarn = true;
      else if (req === 'points_500' && totalPoints >= 500) shouldEarn = true;
      else if (req === 'save_5_times' && saveCount >= 5) shouldEarn = true;

      if (shouldEarn) {
        try {
          // Save to backend
          await achievementsAPI.earnAchievement(achievement.id);
          
          // Update local state
          setAchievements(prev => prev.map(a => 
            a.id === achievement.id ? { ...a, earned: true } : a
          ));
          
          setTotalPoints(prev => prev + achievement.points);
          showAchievementNotification(achievement);
        } catch (error) {
          console.error('Error earning achievement:', error);
        }
      }
    }
  };

  const showAchievementNotification = (achievement) => {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      animation: slideInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    notification.innerHTML = `
      <div class="achievement-notification-content" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 15px;
        min-width: 300px;
      ">
        <div class="achievement-notification-icon" style="
          font-size: 48px;
          animation: iconBounce 0.8s ease infinite;
        ">${achievement.icon}</div>
        <div class="achievement-notification-text">
          <h4 style="margin: 0 0 5px 0; font-size: 16px;">🎉 Achievement Unlocked!</h4>
          <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold;">${achievement.name}</p>
          <span style="font-size: 14px; opacity: 0.9;">+${achievement.points} points</span>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.4s ease-out forwards';
      setTimeout(() => {
        notification.remove();
      }, 400);
    }, 4000);
  };

  const getLevel = () => {
    if (totalPoints < 50) return { level: 1, title: 'Novice', color: '#11998e', icon: '🌱' };
    if (totalPoints < 150) return { level: 2, title: 'Apprentice', color: '#38ef7d', icon: '🔧' };
    if (totalPoints < 300) return { level: 3, title: 'Developer', color: '#f7b733', icon: '💻' };
    if (totalPoints < 500) return { level: 4, title: 'Expert', color: '#fc4a1a', icon: '🔥' };
    if (totalPoints < 800) return { level: 5, title: 'Master', color: '#ee0979', icon: '⚡' };
    return { level: 6, title: 'Legend', color: '#FFD700', icon: '👑' };
  };

  const currentLevel = getLevel();
  const earnedCount = achievements.filter(a => a.earned).length;
  const nextLevelPoints = Math.ceil((currentLevel.level * 150) / 50) * 50;
  const progressToNext = ((totalPoints % nextLevelPoints) / nextLevelPoints) * 100;

  // Check achievements periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndUnlockAchievements();
    }, 5000);

    return () => clearInterval(interval);
  }, [totalEdits, totalRuns, sessionTime, saveCount, streak, totalPoints]);

  return (
    <div className="custom-game">
      <header className="game-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            ← Dashboard
          </button>
          <h1>🎮 Game Studio</h1>
        </div>
        <div className="header-stats">
          <motion.div 
            className="stat-card level-card" 
            style={{ borderColor: currentLevel.color }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <motion.div 
              className="stat-icon" 
              style={{ color: currentLevel.color }}
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1.1, 1]
              }}
              transition={{ 
                repeat: Infinity,
                repeatDelay: 2,
                duration: 0.8
              }}
            >
              {currentLevel.icon}
            </motion.div>
            <div>
              <span className="stat-label">Level {currentLevel.level}</span>
              <span className="stat-value">{currentLevel.title}</span>
            </div>
          </motion.div>
          <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <motion.div
              animate={{ 
                rotate: 360
              }}
              transition={{ 
                repeat: Infinity,
                duration: 3,
                ease: 'linear'
              }}
            >
              <FaStar className="stat-icon star" />
            </motion.div>
            <div>
              <span className="stat-label">Points</span>
              <motion.span 
                className="stat-value"
                key={totalPoints}
                initial={{ scale: 1.5, color: '#FFD700' }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.3 }}
              >
                {totalPoints}
              </motion.span>
            </div>
          </motion.div>
          <div className="stat-card">
            <FaFire className="stat-icon fire" />
            <div>
              <span className="stat-label">Streak</span>
              <span className="stat-value">{streak}</span>
            </div>
          </div>
          <div className="stat-card">
            <FaTrophy className="stat-icon trophy" />
            <div>
              <span className="stat-label">Achievements</span>
              <span className="stat-value">{earnedCount}/{achievements.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="game-body">
        <div className="main-content">
          <VSCodeIDE onPointsEarned={handlePointsEarned} />
        </div>

        <button 
          className={`panel-toggle ${!isPanelOpen ? 'closed' : ''}`}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          title={isPanelOpen ? 'Hide Panel' : 'Show Panel'}
        >
          {isPanelOpen ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        <aside className={`gamification-panel ${!isPanelOpen ? 'hidden' : ''}`}>
          <div className="panel-section">
            <h3>
              <FaChartLine /> Progress to Level {currentLevel.level + 1}
            </h3>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{ 
                  width: `${progressToNext}%`,
                  background: `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color}cc)`
                }}
              />
            </div>
            <p className="progress-text">
              {nextLevelPoints - (totalPoints % nextLevelPoints)} points to next level
            </p>
          </div>

          <div className="panel-section stats-grid">
            <div className="mini-stat">
              <FaCode className="mini-stat-icon" />
              <div>
                <span className="mini-stat-value">{totalEdits}</span>
                <span className="mini-stat-label">Edits</span>
              </div>
            </div>
            <div className="mini-stat">
              <FaRocket className="mini-stat-icon" />
              <div>
                <span className="mini-stat-value">{totalRuns}</span>
                <span className="mini-stat-label">Runs</span>
              </div>
            </div>
            <div className="mini-stat">
              <FaHeart className="mini-stat-icon" />
              <div>
                <span className="mini-stat-value">{saveCount}</span>
                <span className="mini-stat-label">Saves</span>
              </div>
            </div>
            <div className="mini-stat">
              <FaBolt className="mini-stat-icon" />
              <div>
                <span className="mini-stat-value">{sessionTime}</span>
                <span className="mini-stat-label">Minutes</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>
              <FaTrophy /> Achievements ({earnedCount}/{achievements.length})
            </h3>
            <div className="achievements-list">
              {achievements.map((achievement, index) => (
                <motion.div 
                  key={achievement.id} 
                  className={`achievement-item ${achievement.earned ? 'earned' : ''}`}
                  title={achievement.description}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: index * 0.05,
                    duration: 0.3
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.span 
                    className="achievement-icon"
                    animate={achievement.earned ? {
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.2, 1.2, 1.2, 1.2, 1]
                    } : {}}
                    transition={{
                      repeat: Infinity,
                      repeatDelay: 5,
                      duration: 0.6
                    }}
                  >
                    {achievement.icon}
                  </motion.span>
                  <div className="achievement-info">
                    <strong>{achievement.name}</strong>
                    <small>{achievement.description}</small>
                    <span className="achievement-points">+{achievement.points} pts</span>
                  </div>
                  {achievement.earned && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: 'spring',
                        stiffness: 260,
                        damping: 20
                      }}
                    >
                      <FaMedal className="earned-badge" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3>
              <FaStar /> Recent Activity
            </h3>
            <div className="activity-list">
              <AnimatePresence>
                {recentActivities.length === 0 ? (
                  <p className="no-activity">Start coding to see your activity!</p>
                ) : (
                  recentActivities.map((activity, index) => (
                    <motion.div 
                      key={`${activity.time}-${index}`} 
                      className="activity-item"
                      initial={{ opacity: 0, y: -20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 100 }}
                      transition={{ 
                        duration: 0.3,
                        type: 'spring',
                        stiffness: 500,
                        damping: 30
                      }}
                    >
                      <motion.div 
                        className="activity-points"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          delay: 0.1,
                          type: 'spring',
                          stiffness: 500
                        }}
                      >
                        +{activity.points}
                      </motion.div>
                      <div className="activity-details">
                        <span>{activity.reason}</span>
                        <small>{activity.time}</small>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="panel-section tips">
            <h3>💡 Pro Tips</h3>
            <ul>
              <li>Edit code frequently to build your streak</li>
              <li>Run your code to test and earn points</li>
              <li>Save regularly to unlock achievements</li>
              <li>Try creating interactive React components</li>
              <li>Experiment with CSS animations</li>
              <li>Keep coding to level up faster!</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CustomGame;
