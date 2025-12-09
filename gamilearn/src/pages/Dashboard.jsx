import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { modulesAPI, userAPI, achievementsAPI } from '../api/api';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [modules, setModules] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Gamification states
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesRes, profileRes, achievementsRes] = await Promise.all([
          modulesAPI.getAll(),
          userAPI.getProfile(),
          achievementsAPI.getUserAchievements()
        ]);
        
        setModules(modulesRes.data.modules);
        setProfile(profileRes.data.user);
        
        // Get achievements from backend
        const learningAchievements = achievementsRes.data.achievements.filter(
          a => a.category === 'learning' || a.category === 'general'
        );
        setAchievements(learningAchievements);
        
        // Calculate gamification data from user profile
        const userData = profileRes.data.user;
        const points = userData.totalPoints || 0;
        setTotalPoints(points);
        setLevel(userData.level || 1);
        
        setLoading(false);

        // Show message for new users who don't know JavaScript
        if (searchParams.get('message') === 'start-basics') {
          toast.info("Welcome! We've prepared JavaScript basics modules for you to start with. 🚀");
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const { refreshProfile } = useAuth();

  const handleStartModule = async (moduleId) => {
    try {
      await userAPI.setCurrentModule(moduleId);
      if (refreshProfile) await refreshProfile();
      navigate(`/editor/${moduleId}`);
    } catch (error) {
      console.error('Error starting module:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your learning dashboard...</p>
      </div>
    );
  }

  const completedModuleIds = (profile?.completedModules || []).map(m => (m.moduleId && m.moduleId._id) ? m.moduleId._id.toString() : (m.moduleId ? m.moduleId.toString() : null)).filter(Boolean);
  const completionPercentage = modules.length > 0 
    ? Math.round((completedModuleIds.length / modules.length) * 100)
    : 0;
  
  // Calculate in-progress modules (not completed)
  const inProgressCount = Math.max(0, modules.length - completedModuleIds.length);
  const hasCurrentModule = profile?.currentModule && profile.currentModule._id;
  
  const earnedAchievements = achievements.filter(a => a.earned).length;
  const xpToNextLevel = 200 - (totalPoints % 200);
  const xpProgress = (totalPoints % 200) / 200 * 100;

  return (
    <div className="dashboard">
      {/* Hero Header */}
      <motion.header 
        className="dashboard-hero"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-content">
          <div className="hero-left">
            <motion.div 
              className="hero-title"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <h1>🎮 GamiLearn</h1>
              <p className="hero-subtitle">Level up your coding skills</p>
            </motion.div>
            
            <motion.div 
              className="hero-stats-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="hero-stat-card">
                <div className="hero-stat-icon">🏆</div>
                <div className="hero-stat-info">
                  <span className="hero-stat-label">Level</span>
                  <span className="hero-stat-value">{level}</span>
                </div>
              </div>
              <div className="hero-stat-card">
                <div className="hero-stat-icon">⭐</div>
                <div className="hero-stat-info">
                  <span className="hero-stat-label">Points</span>
                  <span className="hero-stat-value">{totalPoints}</span>
                </div>
              </div>
              <div className="hero-stat-card">
                <div className="hero-stat-icon">📚</div>
                <div className="hero-stat-info">
                  <span className="hero-stat-label">Completed</span>
                  <span className="hero-stat-value">{completedModuleIds.length}/{modules.length}</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="hero-right">
            <motion.div 
              className="user-profile-card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="profile-avatar-large">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h3>{user?.name}</h3>
                <p>{user?.email}</p>
              </div>
            </motion.div>
            
            <div className="hero-actions">
              <motion.button 
                className={`btn-hero btn-primary ${!profile?.gameStudioEnabled ? 'btn-disabled' : ''}`} 
                onClick={() => {
                  if (profile?.gameStudioEnabled) navigate('/custom-game');
                  else toast.info('Complete your learning path to unlock Game Studio!');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎮 Create Game
              </motion.button>
              <motion.button 
                className="btn-hero btn-secondary" 
                onClick={() => navigate('/modules')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📖 All Modules
              </motion.button>
              <motion.button 
                className="btn-hero btn-logout" 
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚪 Logout
              </motion.button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <motion.div 
          className="hero-progress"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="progress-label">
            <span>Level {level} Progress</span>
            <span>{xpToNextLevel} XP to Level {level + 1}</span>
          </div>
          <div className="progress-track">
            <motion.div 
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ delay: 0.8, duration: 1 }}
            />
          </div>
        </motion.div>
      </motion.header>

      <div className="dashboard-body">
        {/* Quick Stats Grid */}
        <motion.section 
          className="quick-stats"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="stat-box"
            whileHover={{ y: -5, boxShadow: '0 15px 40px rgba(17, 153, 142, 0.3)' }}
          >
            <div className="stat-box-icon">🎯</div>
            <div className="stat-box-content">
              <h4>In Progress</h4>
              <p className="stat-box-value">{inProgressCount}</p>
              <span className="stat-box-label">{hasCurrentModule ? 'Current: ' + (profile.currentModule.title || 'Module') : 'modules remaining'}</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-box"
            whileHover={{ y: -5, boxShadow: '0 15px 40px rgba(247, 183, 51, 0.3)' }}
          >
            <div className="stat-box-icon">🏅</div>
            <div className="stat-box-content">
              <h4>Achievements</h4>
              <p className="stat-box-value">{earnedAchievements}/{achievements.length}</p>
              <span className="stat-box-label">unlocked</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-box"
            whileHover={{ y: -5, boxShadow: '0 15px 40px rgba(252, 74, 26, 0.3)' }}
          >
            <div className="stat-box-icon">🔥</div>
            <div className="stat-box-content">
              <h4>Completion</h4>
              <p className="stat-box-value">{completionPercentage}%</p>
              <span className="stat-box-label">overall progress</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-box"
            whileHover={{ y: -5, boxShadow: '0 15px 40px rgba(102, 126, 234, 0.3)' }}
          >
            <div className="stat-box-icon">🚀</div>
            <div className="stat-box-content">
              <h4>Learning Path</h4>
              <p className="stat-box-value" style={{ fontSize: '16px' }}>
                {user?.learningPath === 'javascript-basics' ? 'Basics' : 'Advanced'}
              </p>
              <span className="stat-box-label">your track</span>
            </div>
          </motion.div>
        </motion.section>

        {/* Achievements Showcase */}
        <motion.section 
          className="achievements-showcase"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="section-header">
            <h2>🏅 Your Achievements</h2>
            <p>{earnedAchievements} of {achievements.length} unlocked</p>
          </div>
          <div className="achievements-row">
            {achievements.slice(0, 8).map((achievement, index) => (
              <motion.div 
                key={achievement.id}
                className={`achievement-item ${achievement.earned ? 'earned' : 'locked'}`}
                title={`${achievement.name} - ${achievement.description}`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.5 + index * 0.05,
                  type: 'spring',
                  stiffness: 260,
                  damping: 20
                }}
                whileHover={{ 
                  scale: achievement.earned ? 1.3 : 1.1,
                  rotate: achievement.earned ? 360 : 0,
                  transition: { duration: 0.4 }
                }}
              >
                <span className="achievement-icon-large">{achievement.icon}</span>
                {achievement.earned && <span className="achievement-glow" />}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Featured Action Card */}
        <motion.section 
          className="featured-action"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div 
            className="action-card"
            whileHover={{ scale: 1.02, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)' }}
          >
            <div className="action-left">
              <div className="action-icon">🎮</div>
              <div className="action-text">
                <h3>Game Studio</h3>
                <p>Build custom React games with our VS Code-like IDE. Earn points, unlock achievements, and level up your skills!</p>
              </div>
            </div>
            <motion.button 
              className={`btn-action ${!profile?.gameStudioEnabled ? 'btn-disabled' : ''}`}
              onClick={() => {
                if (profile?.gameStudioEnabled) navigate('/custom-game');
                else toast.info('Complete your learning path to unlock Game Studio!');
              }}
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Creating →
            </motion.button>
          </motion.div>
        </motion.section>

        {/* Modules Grid */}
        <motion.section 
          className="modules-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="section-header">
            <h2>📚 Learning Modules</h2>
            <p>Master game development through hands-on coding challenges</p>
          </div>

          {modules.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="empty-icon">📭</div>
              <h3>No modules available yet</h3>
              <p>Check back soon for exciting new content!</p>
            </motion.div>
          ) : (
            <div className="modules-grid-new">
              {modules.map((module, index) => {
                const isCompleted = completedModuleIds.includes(module._id);
                
                return (
                  <motion.div 
                    key={module._id} 
                    className={`module-card-new ${isCompleted ? 'completed' : ''}`}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.7 + index * 0.1,
                      duration: 0.5
                    }}
                    whileHover={{ 
                      y: -10,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div className="module-card-header">
                      <motion.div 
                        className="module-icon-new"
                        animate={isCompleted ? { 
                          rotate: [0, 15, -15, 0],
                          scale: [1, 1.2, 1.2, 1]
                        } : {}}
                        transition={{ 
                          repeat: Infinity,
                          repeatDelay: 4,
                          duration: 0.8
                        }}
                      >
                        {isCompleted ? '✅' : '🎯'}
                      </motion.div>
                      <span className={`difficulty-badge-new ${module.difficulty}`}>
                        {module.difficulty}
                      </span>
                    </div>
                    
                    <div className="module-card-body">
                      <h3>{module.title}</h3>
                      <p>{module.description}</p>
                    </div>
                    
                    <div className="module-card-footer">
                      <div className="module-meta-new">
                        <span className="category-tag-new">
                          {module.category.replace('-', ' ')}
                        </span>
                        {module.objectives && (
                          <span className="objectives-tag">
                            {module.objectives.length} tasks
                          </span>
                        )}
                      </div>

                      <motion.button 
                        className="btn-module"
                        onClick={() => handleStartModule(module._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isCompleted ? '🔄 Review' : '▶️ Start'}
                      </motion.button>
                    </div>

                    {isCompleted && (
                      <motion.div 
                        className="completed-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default Dashboard;
